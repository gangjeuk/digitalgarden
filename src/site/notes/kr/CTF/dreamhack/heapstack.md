---
{"dg-publish":true,"permalink":"/kr/CTF/dreamhack/heapstack/","created":"2023-12-10","updated":"2023-12-10"}
---

힙 공부를 하다가 힙 문제를 풀어보려고 찾다가 나온 문제.

fastbin 관련 문젠 줄 알고 계속 그쪽으로 시도하다가 시간이 굉장히 오래 걸렸다.

fasbin dup 등과 같은 공격과는 아무런 관련도 없고 그냥 코드 취약점을 이용해서 fake chunk를 사용해서 free 함수 실행 중에 특정 주솟값을 조작하는 문제였다….

# POC


```embed-python
PATH: 'vault://data/dreamhack/heapstack/answer.py'

```