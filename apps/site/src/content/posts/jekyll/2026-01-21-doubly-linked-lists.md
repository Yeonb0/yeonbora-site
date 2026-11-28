---
title: "[DS] Doubly Linked Lists"
field: computer
context: course
course: 자료구조
topic: data-structure
series: 자료구조
step: 14
source: jekyll
originalUrl: https://yeonb0.github.io/data-structure/ds-doubly-linked-lists/
date: 2026-01-21
tags:
  - DS
  - 자료 구조
  - 연결 리스트
  - Data-Structure
toc: true
---

- Declarations
```c
typedef struct _node {
	struct _node *llink;
	element item;
	struct _node *rlink;
} node;
typedef node *node_pointer;
```



![](../../_assets/jekyll/2026-01-21-doubly-linked-lists/img_1.png)

```c
ptr == ptr->llink->rlink == ptr->rlink->llink
```

![](../../_assets/jekyll/2026-01-21-doubly-linked-lists/img_2.png)



### [Program 4.26] : Insertion to Doubly Linked Circular List

```c
void dinsert(node_pointer node, node_pointer newnode) {
	// node의 오른쪽에 newnode 추가
	newnode->llink = node;
	newnode->rlink = node->rlink;
	node->rlink->llink = newnode;
	node->rlink = newnode;
}
```

![](../../_assets/jekyll/2026-01-21-doubly-linked-lists/img_3.png)



### [Program 4.27] : Deletion from Doubly Linked Circular List

```c
void ddelete(node_pointer node, node_pointer deleted) {
	// doubly linked list에서 deleted 삭제 
	if (node == deleted)
		printf("Deletion of head node not permitted.\n");
	else {
		deleted->llink->rlink = deleted->rlink;
		deleted->rlink->llink = deleted->llink;
		free(deleted);
	}
}
```



![](../../_assets/jekyll/2026-01-21-doubly-linked-lists/img_4.png)

