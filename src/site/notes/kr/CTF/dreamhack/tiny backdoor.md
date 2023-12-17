---
{"dg-publish":true,"permalink":"/kr/CTF/dreamhack/tiny backdoor/","tags":["CTF/dreamhack/tiny_backdoor","pwnable","TODO/need_to_upload"],"created":"2023-12-14","updated":"2023-12-14"}
---

# 풀이
1byte의 값을 조작할 수 있는 취약점을 가지고 setbuf, fini_array 등을 잘 조작하면서 libc_base를 유출하고 shell 까지 얻으면 된다...

그런데 *Server 환경과 Docker 환경에서 사용하는 libc의 경우 같은 버전이어도 offset 차이가 있을 수 있다는 것을 명심하고 진행하여야 한다.*

로컬에서는 exploit이 가능했는데 리모트에서는 불가능해서 얼마나 삽질을 했는지 모른다...(풀고 나서 머리가 개운한게 아니라 머리가 핑 돌면서 어질어질 했다)

# 참고
만약 libc 라이브러리 내에서의 함수 주소를 leak 할 수 있으면 아래 링크를 이용해서 어떤 libc를 사용하고 있는지 알 수 있다.

- https://libc.rip/ 

[[kr/CTF/Basic/ELF 파일 형식에서 재배치(Relocation), 링킹(Linking) 까지\|또 got와 plt 등 ELF에 관한 내용을 공부하면 풀기 쉬울지도?]]
# POC
```embed-python
PATH: 'vault://data/dreamhack/tiny backdoor/answer.py'


```