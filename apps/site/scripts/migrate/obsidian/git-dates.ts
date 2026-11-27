// Main git 기록을 한 번만 읽어 노트별 처음 생긴 날 (YYYY-MM-DD) 을 낸다
import { execFileSync } from "node:child_process";

export const readCreatedDates = (vaultDir: string): Map<string, string> => {
  let Out: string;
  try {
    Out = execFileSync(
      "git",
      [
        "-c",
        "core.quotepath=false",
        "log",
        "--reverse",
        "-M",
        "--relative",
        "--name-status",
        "--format=%x00%as",
      ],
      {
        cwd: vaultDir,
        encoding: "utf8",
        maxBuffer: 256 * 1024 * 1024,
        stdio: "pipe",
      },
    );
  } catch (e) {
    const Msg = e instanceof Error ? e.message : String(e);
    throw new Error(
      `git 기록을 읽지 못했습니다 (${vaultDir}) : git 저장소가 아니거나 git 이 없습니다\n${Msg}`,
    );
  }

  const Dates = new Map<string, string>();
  // 오래된 커밋부터 되감는다 : 커밋마다 날짜 한 줄 뒤에 변경 줄이 이어진다
  for (const Chunk of Out.split("\0")) {
    if (!Chunk) continue;
    const [Date, ...Lines] = Chunk.split("\n");
    for (const Line of Lines) {
      if (!Line) continue;
      const [Status, P1, P2] = Line.split("\t");
      if (Status === "A") {
        Dates.set(P1, Dates.get(P1) ?? Date);
      } else if (Status.startsWith("R")) {
        Dates.set(P2, Dates.get(P1) ?? Date);
        Dates.delete(P1);
      } else if (Status.startsWith("C")) {
        if (!Dates.has(P2)) Dates.set(P2, Date);
      } else if (Status === "D") {
        Dates.delete(P1);
      }
    }
  }

  for (const K of [...Dates.keys()]) if (!K.endsWith(".md")) Dates.delete(K);
  return Dates;
};
