---
{"dg-publish":true,"permalink":"/kr/CTF/picoCTF/SideChannel/","tags":["forensics","side_channel","timing_based"],"created":"2023-09-10"}
---



# 풀이


> timing based side channel 공격 임의로
> 시간과 관련된 것으로 가정하고 문제풀이


## strace

Reversing결과 reversing이 불가능하게 되어있다.
하지만 strace로 사용한 결과 문자열이 8개인 경우와 그렇지 않은 경우에 따라서 발생하는 Signal의 횟수가 달라졌다. 

즉 문자열은 8개인 것이 맞는 것 같고. 

문자열을 각각 대입해 보았을 때 시간을 측정한 결과 내부 실행 패턴이 다음과 같음을 파악 가능.

1. 문자열의 첫 문자부터 확인
2. 문자열이 맞는 경우 실행시간이 증가
3. 그다음 문자를 확인

하지만 첫 번째 문자가 틀리면 그 뒤에 문자가 맞더라도 실행시간이 증가하지 않았다.


# POC

```embed-python
PATH: 'vault://data/picoCTF/SideChannel/answer.py'

```

