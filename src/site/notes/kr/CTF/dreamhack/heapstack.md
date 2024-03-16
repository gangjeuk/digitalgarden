---
tags:
  - CTF/dreamhack/heapstack
  - pwnable
created: 2023-12-10
글확인: true
dg-publish: true
updated: 2023-12-10
---
힙 공부를 하다가 힙 문제를 풀어보려고 찾다가 나온 문제.

fastbin 관련 문젠 줄 알고 계속 그쪽으로 시도하다가 시간이 굉장히 오래 걸렸다.

fasbin dup 등과 같은 공격과는 아무런 관련도 없고 그냥 코드 취약점을 이용해서 fake chunk를 잘 조작하면 되는 문제였다.

# POC


```embed-python
PATH: 'vault://data/dreamhack/heapstack/answer.py'

```