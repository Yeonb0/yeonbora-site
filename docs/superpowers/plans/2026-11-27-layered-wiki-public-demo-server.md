# Layered Wiki 공개 시연 서버 (Cloud Run) Implementation Plan (하니스)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 하니스 시연 API 를 Dify 없이 · OpenRouter 모델로 Google Cloud Run (도쿄) 에 올려 `https://demo-api.yeonbora.dev` 에서 어느 기기로나 시연 순서 1 ~ 16 이 돌게 한다.

**Architecture:** `serve/demo_api.py` 는 Dify 호출을 주입받는 함수 (`dify_fn`, `dify_chat_fn`) 로 쓰므로, 같은 모양의 대신 함수 둘 (`serve/direct_front.py`) 을 넣고 `--front direct` 로 고른다. LLM 클라이언트는 환경 변수가 있을 때만 API 키 헤더를 붙여 실험 경로 요청이 그대로다. 컨테이너 하나에 bge-m3 `llama-server` (CPU) 와 시연 API 를 함께 띄운다.

**Tech Stack:** Python 3 (`requests`, `unittest`), React + Vite (demo_ui, vitest), Docker, Google Cloud Run · Cloud Build · Secret Manager, OpenRouter, llama.cpp

**Spec:** yeonbora-site `docs/superpowers/specs/2026-11-27-layered-wiki-project-page-design.md` 9.4 ~ 9.9. 하니스 지침 (프로젝트 지침 v3) 3절 18 ~ 22, 9절

## Global Constraints

- 저장소 : layered-wiki-harness. 하니스 코드 변경은 지침 9절 B형 : 커밋 전에 `git diff` 전체를 관리자님께 보이고 멈춘다. 관리자님 확인 뒤 커밋
- 실험 경로 (agent · runner · retrieval · labeling · 테스트) 의 동작이 바뀌면 안 된다 : `python3 -m unittest discover -s tests -v` 전체 통과가 모든 Task 의 완료 조건
- 숨은 기본값 금지 : 새 실행 옵션은 기본값 없이, 빠지면 `parser.error`
- 키 값은 로그 · 오류 메시지 · 저장소 · 이미지에 남기지 않는다. 변수 이름만 쓴다
- 하루 상한 30회 (`--daily-job-limit 30`), OpenRouter 키 상한 $5 (관리자님이 OpenRouter 화면에서 설정)
- 상한 대상 POST : `/run`, `/jobs`, `/live`, `/ask`, `/minutes`, `/meetings/<id>/assign`. 4xx · 5xx 로 끝난 요청은 되돌린다. 날짜 경계는 Asia/Seoul 자정
- 한도 초과 응답 : `429 {"ok": false, "error_type": "DailyLimit", "message": "오늘 시연 투입 한도에 도달했습니다"}`
- Cloud Run : 리전 `asia-northeast1`, 최대 인스턴스 1, `--no-cpu-throttling`, 최소 인스턴스 0 (데모데이 12-16 · 12-18 · 리허설 날만 1), `--allow-unauthenticated`
- 시연 API 실행 옵션 (컨테이너) : `--cors-origin https://yeonbora.dev --front direct --daily-job-limit 30`
- 미리 돌린 볼트 `~/layered-wiki-work/demo/demo900_propose_20261022_193431` 와 `~/models/bge-m3-Q8_0.gguf` 는 저장소에 커밋하지 않는다. 배포 스크립트가 빌드 재료 폴더로 복사
- 서버 실행 · gcloud 인증 · Secret 등록 · 도메인 확인 · DNS 는 관리자님 터미널 / 화면 (지침 9절 "누가 실행하는가"). Claude 는 명령을 쓴다
- 공개 서버에는 합성 시연 코퍼스만. 실제 코퍼스 · 실험 로그 금지 (지침 3절 18, 21)

## Review Focus

1. 라이브 투입 중 인스턴스가 재시작됨 (배포 · Cloud Run 이동) : 작업이 사라져도 화면이 "running" 으로 영원히 남지 않는다 → Task 4 에 "제출 실패 시 workflow_finished failed" 테스트, 화면은 기존 timeout 처리에 맡김
2. OpenRouter 가 상한 · 장애로 402 / 429 / 5xx 를 돌려줌 : 라이브 · Q&A 가 원인 코드가 보이는 실패로 끝나고 하루 카운터는 되돌려진다 → Task 3 의 되돌림 테스트, Task 5 의 chat 예외 테스트
3. 누군가 `/jobs` 를 화면 없이 직접 반복 호출 : 라이브와 같은 카운터에 걸린다 → Task 3 의 `/jobs` 카운트 테스트
4. Q&A 답이 보기 밖 노트 id 를 인용 : 근거에서 빠지고 "검색 결과에 없는 인용 (무효)" 줄로 드러난다 → Task 5 의 `format_answer` 테스트
5. 컨테이너에 `.git` 이 없음 : 시연 API 가 `git_head_commit` 에서 죽지 않고, 배포 스크립트가 넘긴 커밋을 기록한다 → Task 3 의 `--harness-commit` 테스트

---

### Task 1: LLM 클라이언트에 선택적 API 키 헤더

**Files:**
- Modify: `agent/llm_client.py` (`chat` 의 `requests.post` 호출)
- Test: `tests/test_agent_llm_client.py`

**Interfaces:**
- Produces: 상수 `LLM_API_KEY_ENV = "LAYERED_WIKI_LLM_API_KEY"`. 변수가 있고 비어 있지 않으면 `headers={"Authorization": f"Bearer {key}"}`, 없으면 `requests.post` 를 지금과 똑같은 인자로 부른다

- [ ] **Step 1: 실패하는 테스트** — `test_no_api_key_sends_identical_request` (변수 없음 → `requests.post` 호출 kwargs 에 `headers` 키가 없다, json 본문이 지금과 같다), `test_api_key_adds_bearer_header` (변수 = `"k"` → `headers == {"Authorization": "Bearer k"}`), `test_empty_api_key_is_treated_as_absent`. `unittest.mock.patch("agent.llm_client.requests.post")` 와 `patch.dict(os.environ, ...)` 사용
- [ ] **Step 2:** `python3 -m unittest tests.test_agent_llm_client -v` → 새 테스트 FAIL
- [ ] **Step 3:** 구현. 주석 : 실험 경로는 변수를 두지 않으므로 요청이 바뀌지 않는다
- [ ] **Step 4:** `python3 -m unittest discover -s tests -v 2>&1 | tail -5` → `OK`
- [ ] **Step 5:** diff 를 관리자님께 보이고 멈춤 → 확인 뒤 `git commit -m "llm_client : LAYERED_WIKI_LLM_API_KEY 가 있을 때만 Bearer 헤더 (공개 시연 서버용)"`

### Task 2: OpenRouter 모델 고르기 (실제 요청 확인)

**Files:**
- Create: `deploy/demo-cloudrun/probe_openrouter.py`

**Interfaces:**
- Produces: `probe(model_id: str) -> dict` — `agent.llm_client.chat` 으로 실제 요청 1건 (분해 단계와 같은 `response_schema`, `GenerationConfig(temperature=0, seed=20261127, max_tokens=512, enable_thinking=False)`) 을 보내고 `{"model": ..., "ok": bool, "error": str|None, "prompt_tokens": int, "completion_tokens": int, "elapsed_s": float}` 를 출력. 실행 : `LAYERED_WIKI_LLM_ENDPOINT=https://openrouter.ai/api/v1/chat/completions LAYERED_WIKI_LLM_API_KEY=… python3 deploy/demo-cloudrun/probe_openrouter.py <model>...`

- [ ] **Step 1:** 스크립트 작성. 입력 문서는 합성 시연 코퍼스의 문서 0015 (관리자님 WSL 의 `demo_corpus/pages/`) 만 쓴다
- [ ] **Step 2 (관리자님 터미널):** OpenRouter 에서 키를 만들고 금액 상한 $5 설정. 후보를 순서대로 돌린다 : `qwen/qwen3-8b` (아직 있으면 1순위), 그다음 OpenRouter 모델 목록에서 `structured_outputs` 지원 · 생각 모드 끄기 가능 · 입력 백만 토큰당 가장 싼 Qwen3 계열 2개
- [ ] **Step 3:** 결과 표를 받아 `ok` 이고 가장 싼 모델을 고른다. 하나도 `ok` 가 아니면 멈추고 실패 원인 (예 : `chat_template_kwargs` 거절, reasoning 누출) 을 관리자님께 보고. 고친다면 Task 1 과 같은 방식 (환경 변수가 있을 때만 바뀌는 분기 + 실험 경로 회귀 테스트)
- [ ] **Step 4:** 고른 모델 id 를 설계 문서 9.9-2 와 프로젝트 문서 "시연 화면 보여주는 법" 에 적는다. 스크립트는 커밋 (B형)

### Task 3: 시연 API 옵션 : `--front` · `--model-id` · `--daily-job-limit` · `--harness-commit`, health 필드

**Files:**
- Create: `serve/limits.py`
- Modify: `serve/demo_api.py` (`parse_args`, `main`, `DemoApp.__init__` · `health`, `make_handler` 의 `do_POST`)
- Test: `tests/test_demo_limits.py` (새), `tests/test_demo_api.py`

**Interfaces:**
- Produces: `class DailyCounter: __init__(self, limit: int, today_fn: Callable[[], datetime.date]); take(self) -> bool; give_back(self) -> None; used(self) -> int` (스레드 안전, 날짜가 바뀌면 0 으로)
- `DemoApp.__init__(..., model_id_override: str | None = None, front: str = "dify", daily_counter: DailyCounter | None = None)` — 마지막 셋은 키워드 인자, 기존 호출부 · 테스트는 그대로 동작
- `health()` 에 `"model_id"` (덮어쓴 값 또는 manifest 값), `"base_model_id"` (manifest 값), `"front"` 추가
- `parse_args` : `--front {dify,direct}` (필수), `--model-id`, `--daily-job-limit` (양의 정수), `--harness-commit` (40자 hex). 규칙 : `--front direct` 이면 `--dify-url` · `--dify-key-env` · `--dify-qa-key-env` 금지, `--model-id` 와 `--daily-job-limit` 필수. `--front dify` 이면 지금 규칙 그대로
- `main` : `--harness-commit` 이 있으면 `commit_fn=lambda: Args.harness_commit`, 없으면 지금처럼 `git_head_commit`

- [ ] **Step 1: 실패하는 테스트** — `DailyCounter` : 30번 take 후 31번째 False, give_back 후 다시 True, 날짜가 바뀌면 used 0. 핸들러 : 한도 1 로 `/jobs` 두 번 → 두 번째 429 와 Global Constraints 의 응답 본문 그대로, 첫 요청이 404 (없는 doc_id) 면 카운터가 되돌려져 다음 요청이 통과. `/view` · `/search` 같은 GET 은 세지 않는다. parse_args : `--front direct` + `--dify-url` → SystemExit, `--front direct` 에 `--model-id` 없음 → SystemExit, `--front` 없음 → SystemExit. health 에 세 필드. `--harness-commit` 으로 만든 앱의 `harness_commit` 이 그 값
- [ ] **Step 2:** `python3 -m unittest tests.test_demo_limits tests.test_demo_api -v` → FAIL
- [ ] **Step 3:** 구현. 카운터 검사는 `do_POST` 에서 경로 판별 직후, 상한 대상 경로만. 응답 상태가 400 이상이면 `give_back`. 오늘 날짜는 `datetime.now(ZoneInfo("Asia/Seoul")).date()`. 로컬 시연 (관리자님 PC) 명령에는 `--front dify` 를 더해야 하므로 프로젝트 문서 "시연 화면 보여주는 법" 탭 4 명령을 함께 고친다
- [ ] **Step 4:** 전체 테스트 → `OK`
- [ ] **Step 5:** diff 보이고 멈춤 → 확인 뒤 커밋 `"시연 API : --front · --model-id · --daily-job-limit · --harness-commit, health 에 모델 · 앞단"`

### Task 4: Dify 대신 라이브 투입 함수

**Files:**
- Create: `serve/direct_front.py`
- Modify: `serve/demo_api.py` (`main` 에서 `--front direct` 일 때 연결)
- Test: `tests/test_demo_direct_live.py`

**Interfaces:**
- Consumes: `DemoApp.submit(body) -> tuple[int, dict]`, `DemoApp.jobs[job_id]["event"]`, `["status"]`, `["result"]`
- Produces: `make_direct_live_fn(App: DemoApp, wait_seconds: float) -> Callable[[dict, str], Iterator[dict]]` — 차례로 `{"event": "workflow_started", "data": {"workflow_run_id": "direct-<32 hex>"}}` 를 내고, `App.submit({"doc_id", "mode"})` 가 202 면 그 작업의 event 를 `wait_seconds` 까지 기다린 뒤 `{"event": "workflow_finished", "data": {"status": "succeeded" | "failed", "outputs": {"job_id": ..., "job_status": ...}}}`. submit 이 202 가 아니면 바로 `status: "failed"`, `outputs.error` 에 응답 본문. `wait_seconds` 는 `main` 에서 900 으로 넘긴다

- [ ] **Step 1: 실패하는 테스트** — 기존 `tests/test_demo_live.py` 의 가짜 앱 · 가짜 chat 픽스처를 재사용해 : 성공 경로에서 `App.live_start` 후 라이브 레코드가 `completed`, `job_id` 가 채워지고 `workflow_run_id` 가 `direct-` 로 시작. submit 이 409 를 돌려주면 레코드가 `failed` 이고 `error_type == "DifyWorkflowFailed"` (기존 `_live_main` 규칙). 이벤트 순서 started → finished
- [ ] **Step 2:** 해당 테스트 FAIL 확인
- [ ] **Step 3:** 구현. `_live_main` 은 고치지 않는다 (같은 이벤트 모양을 내므로)
- [ ] **Step 4:** 전체 테스트 `OK`
- [ ] **Step 5:** diff 보이고 멈춤 → 커밋 `"시연 API : Dify 없이 라이브 투입 (--front direct)"`

### Task 5: Dify 대신 Q&A 함수

**Files:**
- Modify: `serve/direct_front.py`
- Test: `tests/test_demo_direct_ask.py`

**Interfaces:**
- Consumes: `DemoApp.search(mode, viewer_id, query, k) -> tuple[int, dict]` (`context`, `results[].note_id`), `agent.llm_client.chat` (주입 가능하게 `chat_fn` 인자로)
- Produces: `QA_SYSTEM_PROMPT: str` (`demo_dify/layered_qa_chatflow.yml` 의 시스템 프롬프트를 글자 그대로, `{{#…context#}}` 자리만 `{context}`), `format_answer(text: str, allowed_ids: list[str]) -> dict` (yml 의 코드 노드와 같은 결과 : `<think>` 블록 제거, `answer` 끝에 "근거 노트 : …" 줄과 필요하면 "검색 결과에 없는 인용 (무효) : …" 줄, `valid_count`, `invalid_count`), `make_direct_chat_fn(App, chat_fn, model_id: str) -> Callable[[dict, str, str], dict]` — `inputs = {"viewer", "mode"}`, 검색 k = 4 (yml 과 같음), 사용자 메시지는 질문 그대로 (`/no_think` 는 붙이지 않는다 : `enable_thinking=False` 로 끔), 반환 `{"answer": str, "message_id": None, "conversation_id": None}`
- 생성 설정 : `GenerationConfig(temperature=0, seed=App.gen_seed, max_tokens=1024, enable_thinking=False)`

- [ ] **Step 1: 실패하는 테스트** — `format_answer("A 이다 [n1] B [x9]", ["n1"])` 의 answer 가 `"A 이다 [n1] B [x9]\n\n근거 노트 : n1\n검색 결과에 없는 인용 (무효) : x9"`, `valid_count 1`, `invalid_count 1`. `<think>…</think>` 가 지워진다. 가짜 chat_fn 으로 `App.ask` 가 200 과 `sources` (보기 안 노트만) 를 돌려준다. chat_fn 이 예외를 던지면 `App.ask` 가 502 · `error_type == "DifyError"` (기존 규칙) 를 돌려준다. 검색이 0건이어도 chat_fn 이 호출되고 시스템 프롬프트의 노트 자리가 빈 문자열
- [ ] **Step 2:** FAIL 확인
- [ ] **Step 3:** 구현. `main` 에서 `--front direct` 면 `dify_chat_fn=make_direct_chat_fn(App, chat, Args.model_id)` (앱 생성 뒤 주입)
- [ ] **Step 4:** 전체 테스트 `OK`
- [ ] **Step 5:** diff 보이고 멈춤 → 커밋 `"시연 API : Dify 없이 Q&A (챗플로우 프롬프트 · 근거 정리 그대로)"`

### Task 6: demo_ui 문구를 앞단에 맞추기

**Files:**
- Create: `demo_ui/src/front.ts`
- Modify: `demo_ui/src/api.ts` (`HealthResponse` 에 `model_id?: string`, `base_model_id?: string`, `front?: 'dify' | 'direct'`), `demo_ui/src/LiveTab.tsx` (버튼 · 1단계 이름), Dify 를 말하는 다른 화면 문구 (`grep -n "Dify" demo_ui/src/*.tsx` 로 찾은 것)
- Test: `demo_ui/src/front.test.ts`

**Interfaces:**
- Produces: `liveLabels(front: 'dify' | 'direct' | undefined): { button: string; step1: string }` — dify 또는 undefined → `{ button: 'Dify 로 투입', step1: '① Dify 실행 시작' }`, direct → `{ button: '투입', step1: '① 작업 접수' }`

- [ ] **Step 1: 실패하는 테스트** — 위 두 경우를 그대로 단언
- [ ] **Step 2:** `cd demo_ui && npx vitest run src/front.test.ts` → FAIL
- [ ] **Step 3:** 구현. LiveTab 은 `fetchHealth()` 의 `front` 로 문구를 고른다. 대시보드의 경고 줄 (합성 코퍼스 · 메커니즘 시연) 뒤에 health 에 `model_id` 가 있으면 "라이브 모델 : <model_id>" 를 붙인다
- [ ] **Step 4:** `npm run build` (tsc 포함) 와 `npx vitest run` 통과
- [ ] **Step 5:** diff 보이고 멈춤 → 커밋 `"demo_ui : 앞단 (Dify / 직접) 에 맞춘 라이브 문구, 라이브 모델 고지"`

### Task 7: 컨테이너

**Files:**
- Create: `deploy/demo-cloudrun/Dockerfile`, `deploy/demo-cloudrun/entrypoint.sh`, `deploy/demo-cloudrun/.dockerignore`, `deploy/demo-cloudrun/README.md`

**Interfaces:**
- 빌드 재료 폴더 (Task 8 이 만든다) 구조 : `harness/` (저장소 사본, `.git` 제외), `run/demo900_propose_20261022_193431/`, `models/bge-m3-Q8_0.gguf`, `HARNESS_COMMIT` (한 줄)
- 이미지 : 1단계에서 llama.cpp 를 CPU 로 빌드 (`llama-server` 만), 2단계 `python:3-slim` 계열 + `pip install -r requirements.txt` + `llama-server` 바이너리 + 위 재료. 환경 변수 `MODEL_ID` · `DAILY_JOB_LIMIT` 은 Cloud Run 설정에서, `LAYERED_WIKI_LLM_API_KEY` 는 Secret
- `entrypoint.sh` : `llama-server -m /app/models/bge-m3-Q8_0.gguf --host 127.0.0.1 --port 8082 --embedding -ngl 0 -c 8192 -b 8192 -ub 8192 -np 1 -t 2` 를 뒤에서 띄우고 `/health` 가 `ok` 가 될 때까지 (최대 120초) 기다린 뒤 `exec python -m serve.demo_api --run-dir /app/run/demo900_propose_20261022_193431 --host 0.0.0.0 --port "$PORT" --cors-origin https://yeonbora.dev --front direct --model-id "$MODEL_ID" --daily-job-limit "$DAILY_JOB_LIMIT" --harness-commit "$(cat /app/HARNESS_COMMIT)" --meetings-file /tmp/demo/meetings/meetings.json --meetings-seed /app/harness/demo_corpus/meetings/seed_meetings.json --minutes-dir /tmp/demo/minutes`, 환경 `PYTHONHASHSEED=0`, `LAYERED_WIKI_LLM_ENDPOINT=https://openrouter.ai/api/v1/chat/completions`, `LAYERED_WIKI_EMBED_ENDPOINT=http://127.0.0.1:8082/v1/embeddings`, `HOME=/tmp` (작업 폴더 `~/layered-wiki-work` 가 쓰기 가능한 곳에 생기게)

- [ ] **Step 1:** 파일 작성
- [ ] **Step 2 (관리자님 WSL, Docker 가 있으면):** `deploy.sh --local-only` (Task 8) 로 재료 폴더를 만들고 `docker build` → `docker run -p 8090:8080 -e PORT=8080 -e MODEL_ID=<Task 2 모델> -e DAILY_JOB_LIMIT=30 -e LAYERED_WIKI_LLM_API_KEY=…` → `curl localhost:8090/health` 에 `front: direct`, `model_id`. Docker 가 없으면 이 단계는 Task 9 의 Cloud Run 확인으로 대신
- [ ] **Step 3:** 커밋 (B형) `"deploy : Cloud Run 시연 서버 컨테이너"`

### Task 8: 배포 스크립트

**Files:**
- Create: `deploy/demo-cloudrun/deploy.sh`

**Interfaces:**
- 인자 : `deploy.sh <GCP 프로젝트 id> [--local-only]`. 하는 일 : (1) 하니스 작업 트리가 깨끗한지 확인하고 아니면 멈춤 (2) 임시 재료 폴더에 `git archive HEAD` 로 `harness/`, `rev-parse HEAD` 로 `HARNESS_COMMIT`, `~/layered-wiki-work/demo/demo900_propose_20261022_193431` 과 `~/models/bge-m3-Q8_0.gguf` 를 복사 (3) 재료 폴더에 실제 코퍼스 경로 (`corpus/` 원문, `~/layered-wiki-work` 의 다른 실행) 가 없는지 확인 (4) `--local-only` 가 아니면 `gcloud run deploy layered-wiki-demo --source <재료 폴더> --region asia-northeast1 --max-instances 1 --min-instances 0 --no-cpu-throttling --cpu 2 --memory 4Gi --timeout 900 --concurrency 20 --allow-unauthenticated --set-env-vars MODEL_ID=<Task 2 모델>,DAILY_JOB_LIMIT=30 --set-secrets LAYERED_WIKI_LLM_API_KEY=openrouter-demo-key:latest --project <id>`
- 데모데이용 한 줄도 README 에 : `gcloud run services update layered-wiki-demo --min-instances 1 --region asia-northeast1` / 끝나면 `0`

- [ ] **Step 1:** 스크립트 작성 (`set -euo pipefail`, 키 값을 출력하지 않음)
- [ ] **Step 2:** `bash -n deploy.sh` 와 `shellcheck` (있으면) 통과
- [ ] **Step 3:** 커밋 (B형) `"deploy : Cloud Run 배포 스크립트"`

### Task 9: Cloud Run 배포 · 도메인 연결 (관리자님 터미널 · 화면)

**Files:** 없음. 결과를 프로젝트 문서 "시연 화면 보여주는 법" 에 적는다

- [ ] **Step 1:** `gcloud auth login`, `gcloud projects list` 로 결제 연결된 프로젝트 확인 (없으면 콘솔에서 프로젝트 생성 + 결제 계정 연결). `gcloud services enable run.googleapis.com cloudbuild.googleapis.com secretmanager.googleapis.com artifactregistry.googleapis.com`
- [ ] **Step 2:** `printf %s "<키>" | gcloud secrets create openrouter-demo-key --data-file=-` (키는 화면 · 채팅에 남기지 않는다), Cloud Run 서비스 계정에 `roles/secretmanager.secretAccessor`
- [ ] **Step 3:** `deploy/demo-cloudrun/deploy.sh <프로젝트 id>` → 출력된 `*.run.app` 주소로 `curl <주소>/health` → `status ok`, `front direct`, `model_id`
- [ ] **Step 4:** 도메인 : Search Console 에서 `yeonbora.dev` 소유 확인 (아직 안 했으면) → `gcloud beta run domain-mappings create --service layered-wiki-demo --domain demo-api.yeonbora.dev --region asia-northeast1` → 안내된 CNAME (`ghs.googlehosted.com`) 을 Cloudflare DNS 에 `demo-api`, 프록시 끔 (DNS only) → 인증서 발급 후 `curl https://demo-api.yeonbora.dev/health`. 매핑이 막히면 `*.run.app` 주소를 사이트 계획 Task 2 의 `ApiBase` 로 쓴다
- [ ] **Step 5 (끝 확인):** 휴대폰에서 사이트 시연 탭 → 보는 사람 선택 → 대시보드 → 라이브 1건 완료 → Q&A 1건. 하루 카운터가 2 늘었는지 Cloud Run 로그로 확인
- [ ] **Step 6:** 프로젝트 문서 "시연 화면 보여주는 법" 에 공개 서버 절 (주소, 모델, 상한, 데모데이 최소 인스턴스 명령, 공개 서버는 Dify 없음) 을 더하고, 지침 6절 미결정 3 · 7 을 "확정" 으로 옮길지 관리자님께 여쭙는다
