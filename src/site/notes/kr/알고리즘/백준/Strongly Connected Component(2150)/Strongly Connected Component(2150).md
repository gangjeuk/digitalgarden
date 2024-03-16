---
{"dg-publish":true,"permalink":"/kr/알고리즘/백준/Strongly Connected Component(2150)/Strongly Connected Component(2150)/","created":"2024-02-12","updated":"2024-02-12"}
---

[[kr/알고리즘/SCC(Strongly Connected Component) - 코사라주, 타잔 알고리즘\|SSC]] 개념 연습을 위해서 풀어본 문제.

생각보다 구현이 힘들었다.

거기에 더해서 코사라주 알고리즘과 타잔 알고리즘 각각의 특색과 이론을 이해하기 위해서 풀어보았다.

초반에 방문 기록을 set으로 했다가 계속 시간 초과가 나서 벡터로 바꾸어서 진행하였다.

생각보다 set::find가 느린 걸 체감했다.

더해서 코사라주 알고리즘에서 *방문 순서*가 굉장히 중요한 요소인 것을 알 수 있었다.
참고 - https://www.acmicpc.net/board/view/128820
# POC

```embed-c
PATH: "vault://알고리즘/백준/Strongly Connected Component(2150)/answer.cpp"
```