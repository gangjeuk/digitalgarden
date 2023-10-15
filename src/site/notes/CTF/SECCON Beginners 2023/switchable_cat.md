---
{"dg-publish":true,"permalink":"/CTF/SECCON Beginners 2023/switchable_cat/","tags":["SECCON_Beginners_2023","crypto","Medium"]}
---


# reference
[SECCON Beginners CTF 2023 作問者Writeup - Qiita](https://qiita.com/ushigai_sub/items/f1d0593f52590fe10ca3)

# 결과
- 시도
- 해결 실패 


문제 코드

```embed-python
PATH: 'vault://data/SECCON_Beginners_2023/switchable_cat/problem.py'

```


# 풀이

[線形帰還シフトレジスタ(LFSR:Linear Feedback Shift Register](https://ja.wikipedia.org/wiki/%E7%B7%9A%E5%BD%A2%E5%B8%B0%E9%82%84%E3%82%B7%E3%83%95%E3%83%88%E3%83%AC%E3%82%B8%E3%82%B9%E3%82%BF)

기반의 암호화  

예를 위해

위와 같은 식을 간단하게 6개 비트로 이루어진 평문을 암호화 한다고 했을 때
```Python
b = ((r >> 1) & 1) ^ \
    ((r >> 2) & 1) ^ \
    ((r >> 3) & 1)
```

이때의 난수 생성기에서 반환되는 n번째 난수의 초기 seed가


$$
seed = s_{0}\| s_{1}\| s_{2}\| s_{3}\| s_{4}\|s_{5}
$$
로 표현하면 다음과 같은 행렬식으로 연산을 표현할 수 있다.

$$
{\begin{pmatrix}
   a_n \\
   a_{n-1} \\
   a_{n-2} \\
   a_{n-3} \\
   a_{n-4} \\
   a_{n-5}
\end{pmatrix}
=
\begin{pmatrix}
   0 & 0 & 0 & 1 & 1 & 1 \\
   1 & 0 & 0 & 0 & 0 & 0 \\
   0 & 1 & 0 & 0 & 0 & 0 \\
   0 & 0 & 1 & 0 & 0 & 0 \\
   0 & 0 & 0 & 1 & 0 & 0 \\
   0 & 0 & 0 & 0 & 1 & 0
\end{pmatrix}^n
\cdot
\begin{pmatrix}
   s_{0} \\
   s_{1} \\
   s_{2} \\
   s_{3} \\
   s_{4} \\
   s_{5}
\end{pmatrix}
}
$$



행렬곱은 sage 라이브러리를 이용하면 된다

# POC

```embed-python
PATH: 'vault://data/SECCON_Beginners_2023/switchable_cat/poc.sage'

```

# 실패 원인

1. 행렬곱 생각 못함(제목 검색해 볼 껄...)
2. 처음에 그냥 shift-xor암호화라고 생각해서 계산한게 실패 요인
	1. shift-xor하면 정보 손실 일어난다고 생가해서 풀이 접근이 잘 못 되었다고 깨달았지만 행렬은 생각하지 못함
