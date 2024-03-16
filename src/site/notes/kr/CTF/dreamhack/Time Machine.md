---
tags:
  - reversing
  - code-virtualize
created: 2023-07-14
updated: 2023-07-14
글확인: true
dg-publish: true
---

# Reference

## 코드 가상화 참고자료(문서)

[[kr/기타/코드 가상화 기법을 이용한 악성코드와 그 이용/참고자료/코드 가상화 기법이 적용된 악성코드 분석.pdf]]
[[kr/기타/코드 가상화 기법을 이용한 악성코드와 그 이용/참고자료/Code VirtualizedAnti Reversing Technique.pdf]]
[[kr/기타/코드 가상화 기법을 이용한 악성코드와 그 이용/참고자료/Design and Implementation of Virtualized Code Protection(VCP).pdf]]


## 안드로이드에서의 코드 가상화 사례

[https://www.pnfsoftware.com/blog/reversing-android-protector-virtualization/](https://www.pnfsoftware.com/blog/reversing-android-protector-virtualization/ "https://www.pnfsoftware.com/blog/reversing-android-protector-virtualization/")

## 발표자료(분석)

[https://youtu.be/b6udPT79itk](https://youtu.be/b6udPT79itk "https://youtu.be/b6udpt79itk")

# 풀이

처음 도전한 VM 리버싱 문제.

어려운걸 알고 있었지만, 생각한 것 더 보다 어려웠다.

완전히 분석을 끝내고 문제를 푼 것은 아니지만, 문제를 풀고 다른 사람들 풀이를 보니 생각보다 디스어셈블러 비슷한 것을 제작하여 흐름을 분석하는 사람들이 많았다.

나 같은 경우 첫 흐름을 따라가서 VM의 바이너리에 해당하는 부분을 표시 하게 하여 흐름을 분석 하였다.

```embed-c
PATH: 'vault://data/dreamhack/Time Machine/output.txt'
LINES: 24-39

```

위의 do_or나 wirte_n_size_buf_to_stderr 등은 그냥 내가 리버싱 할 때 사용한 이름이다.

전체적인 흐름을 여기서 전부 설명 할 수는 없지만 입력값을 사용하여 정당한 입력값인 경우 데이터 2개를 xor하여 복호화 하는 코드였다. 

그래서 첫 문장을 xor 하여 데이터를 비교 하였더니 

이 도출 되었고.

그대로 다른 문자열도 복호화를 진행하여 풀었다.

