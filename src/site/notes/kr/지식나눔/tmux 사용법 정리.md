---
dg-publish: true
cover: "[[Pasted image 20231118180909.png]]"
---

# 세션

**세션 생성**
```
tmux new -s <session_name>
```

**세션 분리(detach)**
```
<Ctrl-b> d
```

**세션 목록 확인**
```
tmux ls
```
**세션 재연결**
```
tmux attach -t <session_name>
```
**세션 종료**
```
<Ctrl-b> &
```
# 창
## 분할
| 범주        | 명령어                                     | 동작                                |
| ----------- | ------------------------------------------ | ----------------------------------- |
| **분할**    |                                            |                                     |
|             | `<Ctrl-b> %`                               | 세로로 분할                         |
|             | `<Ctrl-b> "`                               | 가로로 분할                         |
|             | `<Ctrl-b> q`                               | 창의 index를 출력                   |
| **제거**    |                                            |                                     |
|             | `<Ctrl-b> !`                               | 분할된 창 전체 제거                 |
|             | `<Ctrl-b> x`                               | 현재 창 제거                        |
|             | `<Ctrl-d>`                                 | 현재 창 즉시 제거                   |
| **이동**    |                                            |                                     |
|             | `<Ctrl-b> ' + <Index>`                     | 창 Index를 입력해 이동              |
|             | `<Ctrl-b> <방향키>`                        | 방향키를 입력해 이동                |
|             | `<Ctrl-b> <p>`                        | 이전 창으로 이동                |
|             | `<Ctrl-b> <n>`                        | 다음 창으로 이동                |
|             | `<Ctrl-b> <l>`                        | 마지막 창으로 이동                |
| **창 조절** |                                            |                                     |
|             | `<Ctrl-b> :`                               | Prompt 명령어모드 진입              |
|             | `resize-pane -L or -R or -U or -D <size_int>  | 창 크기 조절(e.g resize-pane -L 10) |
|             |                                            |                                     |


# Tip
`<Ctrl-b> [`: 스크롤 활성화
`<Ctrl-b> ?`: 단축키 목록 표시