---
{"dg-publish":true,"permalink":"/kr/기록/논문/Paper Review - Memory Barriers a Hardware View for Software Hackers/","tags":["paper-review/hwViewForSwHackers"],"created":"2024-01-26","updated":"2024-03-16"}
---


# 개요
이 글은 논문 'Memory Barriers a Hardware View for Software Hackers'를 정리한 글임과 동시에 여러 동기화 문제가 근본적으로 왜 발생하고 어떻게 해결되는지에 대해서 다룬다.

글에서 다루게 되는 주제는 

1. 다수의 코어가 존재하는 CPU에서 캐시의 동작
2. 일관성을 유지하는 구체적이고 방법
3. Write barrier, Read barrier가 무었인지
4. 아키텍처 마다 다른 일관성 관리 기법과 OS에서 아키텍처에 따른 일관성을 처리하는 방법

*Note:*
1. *글과 함께 논문을 읽으면 이해하기 쉬울지도?*
2. 논문에서는 CPU를 *본문에서는 Core라고 칭하도록한다*
# MESI
## State
CPU 코어의 캐시의 상태는 4가지로 구분된다

1. Exclusive
	1. 자신의 코어 캐시에만 'Exclusive' 하게 그 값이 존재한다 
2. Modified
	1. Exclusive 와 동일하게 자신의 코어 캐시에만 그 값이 존재한다
	2. 하지만 값이 변경되어서 만약 자신의 값을 버려야한다면 메모리에 값을 반영해야 하는 의무를 가진다
3. Shared
	1. 캐시의 값이 다른 코어와 공유된 상황이다
4. Invalid
	1. 캐시에 아무것도 들어있지 않다

## State Diagram
![image-20240126111231050.png|round](/img/user/kr/%EA%B8%B0%EB%A1%9D/%EB%85%BC%EB%AC%B8/assets/Paper%20Review%20-%20Memory%20Barriers%20a%20Hardware%20View%20for%20Software%20Hackers/image-20240126111231050.png)
### 상태 전이
코어의 캐시 상태는 코어의 동작 또는 코어 간의 동작에 따라서 변화한다.

예를 들어서:
1. Core1이 A라는 Exclusive한 값을 캐시에 저장한 상태
2.  만약 Core2에서 그 값을 Read하는 요청을 보냄
	1. Core1이 Core2의 A의 값을 알려줌
	2.  A는 더 이상 Exclusive하게 Core1만 가지는 값이 아니기 때문에 Shared로 상태가 전이된다

와 같은 방식이다.
### Message
앞서 언급한 읽기 요청이 상태전이를 유발하는 메시지로써 작동한다.

메시지의 종류는
1. Read: 읽기 요청을 하여 다른 코어의 캐시 정보를 요청한다
2. Read Response: 읽기 요청에 대한 대답
3. Invalidate: 상대 코어의 캐시에 존재하는 값을  Invalid하게 만들어라(나만이 그 값을 가질 수 있게 상대방의 값을 삭제해라)
	1. Invalidate Acknowledge: Invalidate하였다는 대답
4. Read + Invalidate: Read 와 Invalidate 두 개를 동시에 요청. Read 한 값을 주고 너는 Invalidate 해라
	1. 당연히 Read Response와 Invalidate Acknowledge 두 가지 대답 모두 필요 
5. Writeback: 캐시의 값을 메모리에 Writeback, 캐시의 공간을 확보하는 효과를 가짐

# 문제와 최적화
MESI를 사용하면 코어들이 공유하지 않는 값들에 대해서 일관성을 유지할 수 있게 해준다.

하지만 상대방의 요청을 매번 기다라면 당연하게 공유 자원을 사용할 때마다 오버헤드가 발생한다.

## Prob 1: Invalidate + Acknowledgement
Message의 전송은 기본적으로 데이터의 송신과 동일하다.

즉, 네트워크 상의 데이터 통신에도 레이턴시가 존재하듯, CPU도 동일하게 요청에 대한 대답을 기다려야 하고 그것이 오버헤드로 작동한다.
![Pasted Image 20240126112647_753.png|center](/img/user/kr/%EA%B8%B0%EB%A1%9D/%EB%85%BC%EB%AC%B8/assets/Paper%20Review%20-%20Memory%20Barriers%20a%20Hardware%20View%20for%20Software%20Hackers/assets/Drawing%202024-01-26%2011.26.23.excalidraw/Pasted%20Image%2020240126112647_753.png)

위와 같은 상황에서 Core0에서 쓰기 동작을 진행하기 위해서는 내 값이 최신 값인지를 확인하기 위해 나머지 Core들에게 Read + Invalidate 를 요청하고 다른 Core들의 값과 내 값을 비교하여야한다.

즉 비교를 위해서 상대방의 메시지를 기다려야 하는 오버헤드가 발생한다.

하지만 *쓰기 동작에서 Core0이 Core1을 항상 기다려야할까?*

어차피 쓰기 동작이면 최신값과 상관없이 내 값이 쓰일 건데?

## Store Buffer
그래서 등장한 것이 Store Buffer로 내가 기다릴 필요 없이 써두었다고 "표시"를 해두기 위한 버퍼이다.

Store buffer의 도입으로 Store 명령이 포함된 명령의 수행할 때 해당 명령어를 상대방의 메시지를 기다릴 필요 없이 바로 수행할 수 있게 된다.

하지만 Store Buffer 만으로는 아래 문제가 발생한다
![image-20240126114430722.png|center](/img/user/kr/%EA%B8%B0%EB%A1%9D/%EB%85%BC%EB%AC%B8/assets/Paper%20Review%20-%20Memory%20Barriers%20a%20Hardware%20View%20for%20Software%20Hackers/image-20240126114430722.png)
\[R + I = Read + Invalidate. ~~그림이 많이 더럽다;;~~\]

그림의 흐름을 간단하게 요약하면 아래와 같다

1.  1 - 2 - 3과정을 통해서 Core0이 a = 1 을 실행하여 a 에 1 이라는 값을 Store 했다
	1. 하지만 실제로는 Store Buffer에만 기록되고 Cache 에는 반영되지 않았다
2. Core1이 b = a + 1의 실행을 위해서 Core0에서 a의 값을 요청한다
	1. Core0은 당연하게도 캐시에 존재하는 값을 건네준다(캐시의 a 값은 0)
3. Core1 은 b = 0 + 1을 실행하고 오류가 발생한다

위 문제는  Store Buffer의 값과 캐시에 존재하는 값 사이에 괴리에 의해서 발생한다.

이를 해결하기 위해서 Store buffer와 Cache의 값을 서로 확인하는 메커니즘을 도입하였다.

### 엿보기  캐시(Store Forwarding의 도입)
![image-20240126130150249.png|center](/img/user/kr/%EA%B8%B0%EB%A1%9D/%EB%85%BC%EB%AC%B8/assets/Paper%20Review%20-%20Memory%20Barriers%20a%20Hardware%20View%20for%20Software%20Hackers/image-20240126130150249.png)

위와 같은 구조를 만듦으로써 문제는 아래와 같이 해결된다.

위의 2. 에서부터 다시 시작해 보자

1. Core1이 b = a + 1의 실행을 위해서 Core0에서 a의 값을 요청한다
	1. Core0은 당연하게도 캐시에 존재하는 값을 ~~건네준다(캐시의 a 값은 0)~~ 건네주기 전에 Store buffer를 확인한다
	2. Store Buffer에서 a가 들어있는 것을 확인한다
	3. 캐시에 존재하는 값이 아닌 Store buffer의 값을 건네준다
2. Core1 은 ~~b = 0 + 1을 실행하고 오류가 발생한다~~ b = 1 + 1을 실행하고 모두가 행복하다
## Store Buffer와 쓰기 문제
모든 것이 순조롭게 흘러가면 좋겠지만 아직 해결되지 않은 문제가 존재한다.

바로 *Core1이 Core0의 Store Buffer 상태를 알 수 없다는 문제이다*.

*응? 방금까지 알 수 있다고 하지 않았나?* 라고 생각할 수 있지만 아래의 예시를 살펴보자.
![image-20240126131223962.png|center](/img/user/kr/%EA%B8%B0%EB%A1%9D/%EB%85%BC%EB%AC%B8/assets/Paper%20Review%20-%20Memory%20Barriers%20a%20Hardware%20View%20for%20Software%20Hackers/image-20240126131223962.png)

이런 순서로 실행될 경우 
1. Core0 의 Store Buffer에 a = 1이 저장되고 다른 CPU에게 R + I를 요청한다
	1. b 는 자신이 유일하게 가지고 있음으로 캐시를 바로 업데이트 한다
2. Core1 이 b == 0을 실행하기 위해서 자기 캐시에 존재하지 않는 b의 값을 "Read" 메시지를 통해 요청한다
3. Core0는 요청받은 b의 값을(b = 1)을 Core1에 전달한다
	1. 현재 Core0의 a 는 Store buffer에 b 는 캐시에 존재하는 상황이다
4. Core1 이 a == 1 을 실행하기 위해서 a 값을 찾는다
5. a가 Core1의 캐시에 이미 존재하고 있기 때문에 바로 값을 사용할 수 있다
6. Core1가 가지고 있는 a 는 0이기 때문에 assert(a == 0) 에서 에러가 발생한다
7. Core0가 요청한 R + I 값이 뒤늦게 도착한다.

와 같은 절묘한 경우의 수가 발생할 수 있다.

당연히 Core0은 a의 값을 자신의 것으로 하기 위해서 Read + Invalidate를 실행하겠지만 Invalidate되기 전에 Core1의 코드가 실행되면서 문제가 발생하게된다.

이 문제의 근본적인 원인은, Store Forwarding을 도입함으로써 남에게 Read를 요청했을 때 최신의 값을 받을 수 있다는 것이 보장되지만, 

*내가 가진 값을 내가 사용할 때 일일이 상대방의 Store Buffer를 확인하지 않음으로써 각 코어간의 데이터에 괴리가 발생할 수 있다는 것이다*

이제 어딘가에서 모순이 발생한다는 것을 알 수 있다.

1. 자기것을 자기가 쓴다는 것에 태클을 건다는 것은 있을 수 없다
2. 그렇다고 데이터를 사용할 때마다  모든 코어의 Store buffer에 대한 확인 절차를 가지면 Store buffer를 도입한 이유가 없다...
# Memory Barrier
그럼 이 문제를 어떻게 해결할 수 있을까?

정답은 간단하다.

그냥 *Store Buffer*에 있는 "표시" "만" 해 놓은 연산을 실제로 반영하면된다.

그럼 위 예시의 문제는 발생하지 않는다. 간단하게 살펴보자

1. Core0 의 ~~Store Buffer에 a = 1이 저장되고 다른 Core에 R + I를 요청한다~~ a = 1 실행을 위해 R + I 요청한다
	1. b 는 자신이 유일하게 가지고 있음으로 캐시를 바로 업데이트 한다
	2. Core1에 a = 1를 캐시에 반영하기 위해서 *R + I를 기다린다*
2. Core1 이 b == 0을 실행하기 위해서 자기 캐시에 존재하지 않는 b의 값을 "Read" 메시지를 통해 요청한다
3. Core0는 요청받은 b의 값을(b = 1)을 Core1에 전달한다
	1. 현재 Core0의 ~~a 는 Store buffer에~~ a, b 는 캐시에 존재하는 상황이다
4. Core1 이 a == 1 을 실행하기 위해서 a 값을 찾는다
5. ~~a가 Core1의 캐시에 이미 존재하고 있기 때문에 바로 값을 사용할 수 있다~~ Invalid 상태이므로 Core0에 값을 요청한다
6. 요청한 값이 도착하고 Core1은 a = 1로 assert문을 통과할 수 있다

이러한 연산들은 CPU에서 자동으로 처리할 수 없고 프로그래머에게 그 책임을 넘겨야한다, 왜냐하면 CPU가 변수들 간의 의존성을 알 수는 없기 때문이다.

이렇게 이러한 데이터 의존성을 프로그래머가 조절하면서 사용할 수 있게 제공되는 연산이 바로 **Memory Barrier** 연산이다.
![image-20240126132335820.png|center](/img/user/kr/%EA%B8%B0%EB%A1%9D/%EB%85%BC%EB%AC%B8/assets/Paper%20Review%20-%20Memory%20Barriers%20a%20Hardware%20View%20for%20Software%20Hackers/image-20240126132335820.png)

여기서 `smp_mb()`는 Store Buffer의 값을 모두 반영하라는 뜻이 된다.
## Invalidate Queue
앞서 해결한 문제가 *쓰기*에 대한 오버헤드를 해결했다면, 이번에는 *읽기*에 대한 오버헤드를 해결하기 위해 도입된 기술에 대해서 알아보자.

다수의 코어 구성 때문에 발생할 수 있는 또 다른 오버헤드는 바로 Invalidate 메시지를 기다려야한다는 것이 존재한다.

매번 Read를 할 때 마다 최신의 값이라는 것을 확인하기 위해서 Read + Invalidate 메시지를 보내고 Invalidate메시지가 도착할 때 까지 기다려야한다.

 오버헤드는 이 기다림에서 발생하게 되는데 만약 Core0이 Core1에 Read + Invalidate를 보냈을 때 Core1 바쁜 상황을 생각해 보자.

 Core1는(~~바빠 죽겠는데~~) 이 R + I 메시지를 처리하기 위해 자신의 캐시를 Invalidate하고 Read한 값을 보내게 된다. 그렇게 되면 바쁜 와중에 Invalidate 메시지를 처리해야한다.
 
그런데 Invalidate된 값을 만약 다시 사용해야 할 경우 Cache miss가 발생하게 된다.(~~이중 오버헤드다!~~)

이 문제를 해결하기 위해서 등장한 것이 Invalidate를 메시지를 받으면 저장해 놓는 Invlidate Queue를 도입하는 것이다.

이제 CPU는 Invalidate메시지가 도착하면 진짜 Invalidate를 하는 것이 아닌 Invalidate Queue에 Invalidate 메시지를 저장하고 Invalidate Acknowledgement를 송신하게 된다.

Invalidate Queue가 해결하고자 하는 문제는 Invalidate 메시지가 도착할 때마다 Invalidate를 진행할 필요가 없다는 것이다.

Invalidate되었다는 것을 '표시'만 해두고 실제로 cache line에 대해서 매번 Invlidate를 하지 않음으로써 오버헤드를 줄이는 것이다.

![image-20240129170224559.png|center](/img/user/kr/%EA%B8%B0%EB%A1%9D/%EB%85%BC%EB%AC%B8/assets/Paper%20Review%20-%20Memory%20Barriers%20a%20Hardware%20View%20for%20Software%20Hackers/image-20240129170224559.png)

## Invalidate Queue와 읽기 문제
지금까지 읽은 Invalidate Queue는 앞서 언급한 Store Buffer와 많은 부분에서 비슷한 면이 존재한다.

이야기를 진행하기 전에 햇갈릴 수 있기 때문에 공통점을 기준으로 약간만 정리를하고 가자.

1. 어떠한 요청이 왔을 때  실제 요청에 대한 처리를 하는 대신에 표시만을 해둔다
2. 요쳥에 대한 처리의 실제 처리 유무와 상관없이 처리 했다는 메시지를 회신한다
3. 그로인해서 
	1. 오버헤드가 줄어든다
	2. 데이터의 괴리가 생기게된다

라는 공통점이 존재한다.

그럼 여기서 Store Buffer와 마찬가지로 Invlidate Queue에 대해서 동일한 의문을 제시할 수 있다.

바로 Invalidate Queue에 저장만 해두고 실제 Invalidate를 하지 않은 채로 Invalidate가 진행되었다고 Invalidate Acknowledgement를 보내도 되는 것인가? 라는 의문이다.

문제는 바로 이 의문에서 시작한다. 

Invalidate Queue에 들어있는 값은 앞으로 Invalidate를 진행하여야 할 값이다.

만약 CPU가 Invalidate를 진행하여야 할 값을 Invalidate 하지 않고 사용하면?

CPU는 자신이 캐시에서 사용하는 값이 정말 최신의 값인지 확인할 수 없다.

만약 CPU가 이 값을 최신의 값이라고 생각하고 사용하게 된다면?

![image-20240129172817797.png|center](/img/user/kr/%EA%B8%B0%EB%A1%9D/%EB%85%BC%EB%AC%B8/assets/Paper%20Review%20-%20Memory%20Barriers%20a%20Hardware%20View%20for%20Software%20Hackers/image-20240129172817797.png)

1. Core0는 a = 1을 실행한다
	1. Shared 상태이므로 Core1으로 R + I를 보낸다
2. Core1에는 b 값이 없음으로 b == 0을 실행하기 위해 Read요청을 Core0에 보낸다
3. Core1는 Core0의 I + R 요청을 Invalidate Queue에 넣고 바로 Invalidate Acknowledgement를 회신한다
	1. 실제 Invalide를 하지 않고 a = 0은 아직 Core1의 캐시에 남아있다(Core1는 너무 바빠서 지금 당장 Invalidate를 할 수 없다)
4. Core0는 b를 캐시에 가지고 있음으로 b = 1 값을 바로 캐시에 반영한다
5. Core0는 Core1의 Read요청에 따라 b = 1을 전송한다
	1. Core1는 While(b == 0)을 탈출할 수 있다
6. Core1은 assert(a == 1)를 실행한다, a == 1는 a 의 값을 read만 하기 때문에 별도의 제약 없이 자신의 캐시에 있는 값을 사용한다
	1. Core1는 너무너무 바빠서 Invalide Queue를 확인하지 않았고 a의 값은 0이다
7. assert는 실패한다 

(정말 절묘한 상황이다...)
# Memory Barrier Again
그럼 위 문제를 어떻게 해결할 수 있을까?

정답은 Store buffer에서 언급한 해결방안과 정확히 일치한다, 방금 발생한 문제는 사실 Invalidate Queue에 있는 'a'가 실제로 Invalidate 됐으면 해결될 문제다.

a가 invalidated 되었으면 6번에서 a == 1을 실행할 때 a 가 Invalidate 되었기 때문에 Core0에게 Read 요청을 통해서 최신 값을 반영하여 assert()가 실패할 일은 없었을 것이다.

그렇다 앞선 Store buffer와 마찬가지로, Invalidate Queue에 있는 값들을 실제로 Invalidate시키면 된다.

즉 Invalidate 되었다고 '표시'만 되어있던 값들을 실제로 Invalidate시키는 것이다.
![image-20240129173616455.png|center](/img/user/kr/%EA%B8%B0%EB%A1%9D/%EB%85%BC%EB%AC%B8/assets/Paper%20Review%20-%20Memory%20Barriers%20a%20Hardware%20View%20for%20Software%20Hackers/image-20240129173616455.png)

# Read and Write Memory Barrier
앞서 설명한 Memory Barrier들은 사실 두 가지 Operation, Read와 Write와 관련이 있다.
이러한 Read와 Write에 대해서 서로 Read Memory Barrier, Write Memory Barrier라는 용어를 사용한다.

- Write Memory Barrier: 쓰기가 실제로 반영되게 한다 
- Read Memory Barrier: 읽기에 대해서 최신의 값을 보장한다

위 단어를 사용하면 방금 그림의 코드를 다음과 같이 바꿀 수 있다.

![image-20240129173952458.png|center](/img/user/kr/%EA%B8%B0%EB%A1%9D/%EB%85%BC%EB%AC%B8/assets/Paper%20Review%20-%20Memory%20Barriers%20a%20Hardware%20View%20for%20Software%20Hackers/image-20240129173952458.png)

코드가 위와 같이 작성된다면 assert에서 오류가 발생하지 않게 된다.

한번 생각해 보자.

조건은 앞선 경우와 마찬가지로 foo와 bar를 각각의 코어가 실행하고 있는 상황을 가정한다

>[!info]- Answer
> 최악의 상황은 assert문이 발생하는 것이다
> 지금까지 assert문이 발생했던 상황은 다음과 같다
> 1. a = 1라는 값이 실제로 *쓰여지지*  않은 경우
> 2. a == 1를 위해 *읽은* 값이 최신의 값이 아닌 경우
> 
> 메모리 배리어를 도입하면서 위 조건은 아래와 같이 해결된다
> 1. Write barrier를 통해 b = 1가 실행된 시점에서 a = 1인것을 보장할 수 있다.
> 	1. 즉 실제로 *쓰여지지* 않은 경우를 방지할 수 있다
> 2. Read barrier를 통해 a == 1 를 위해 읽은 a의 값이 항상 최신의 값을 반영한다고 보장할 수 있다
> 	1. 즉 a = 1 *실제로* 쓰여졌다면, 읽은 a 의 값이 항상 *1* 인것을 보장할 수 있다
> 	2. (반대로 이야기하면 실제로 쓰여지지 않았다면 0 또는 1일 수 있다)


# 부록
지금까지 MESI 프로토콜을 통해 다수의 코어를 가진 CPU에서 어떻게 캐시의 일관성을 지키는지 알아보았다.

다음으로는 일관성을 지키기 위해 발생하는 오버헤드와 이를 해결하기 위해 도입된 여러 최적화 기법에 대해서 알아보았다.

마지막으로 최적화에 따른 부작용과 부작용의 해결의 위해서 어떠한 기법이 존재하고 그 기법을 어떻게 사용할 수 있는지 알아보았다.

앞서 언급한 이 글이 목표했던 5개의 목표 중 마지막을 제외한 모든 것을 글에서 다루었다.

부록에서는 조금 햇갈릴 수 있는 부분과 더불어서 마지막 주제인 CPU 구현, 즉 아키텍처에 따른 특징에 대해서 알아보고 운영체제에서 어떻게 메모리 베리어가 사용되고 있는지 알아보자.
## 메모리 오더와 실행 순서 변경(Memory Reordering)
글에서 자세히 언급하지는 않았지만 사실 메모리 베리어와 CPU의 명령어 실행 순서에는 큰 상관관계가 존재한다.

*Note:* 본 섹션을 읽기 전에 주의할 점
1. 흔히 컴퓨터 아키텍처를 공부할 때 배우는 Out-of-Order Execution과는 다르다
	1. Out of order는 서로 파이프라인 상에서 의존성이 없는 변수에 대한 처리가 중심
	2. 본문은 메모리에 존재하는 하나의 변수에 다수의 코어가 간섭할 시의 동작이 중심
2. 앞서 언급하지는 않았지만 이미 우리는 Store Buffer와 Invalidate Queue를 살펴보면서 이미 실행 순서가 바뀌는 것을 살펴보았다
	1. 글을 더 읽기 전에 앞으로 돌아가서 생각보자
	2. 구체적으로는 [[kr/기록/논문/Paper Review - Memory Barriers a Hardware View for Software Hackers#Store Buffer와 쓰기 문제\|Store Buffer]] 으로 돌아가서 실제 동작의 순서가 어떻게 되는지 중심으로 다시 한번 보자
	




아래에는 Store Buffer에서 살펴본 예시를 중심으로 실제 동작 순서가 어떻게 바뀌는지 살펴보게 될 것이다.

![image-20240126131223962.png|center](/img/user/kr/%EA%B8%B0%EB%A1%9D/%EB%85%BC%EB%AC%B8/assets/Paper%20Review%20-%20Memory%20Barriers%20a%20Hardware%20View%20for%20Software%20Hackers/image-20240126131223962.png)

1. Core0 의 *Store Buffer에 a = 1이 저장되고*  Core1에 R + I를 요청한다
	1. *b 는 자신이 유일하게 가지고 있음으로 캐시를 바로 업데이트 한다*
2. Core1 이 b == 0을 실행하기 위해서 자기 캐시에 존재하지 않는 b의 값을 "Read" 메시지를 통해 요청한다
3. ...

실행 순서 변경의 숨겨진 정답은 바로 위 두 문장이다.

즉 Core0가 실제 수행한 명령어와는 별개로 외부의 관찰자에게는 아직 a = 1은 반영되지 않은 상태이고 b = 1만이 실행된 상황이다.

이 실행 순서가 바로 메모리 오더의 변경, 즉 *메모리 리오더*라는 상황이다.

위 코드의 명령의 Load 와 Store (또는 Read 와 Write) 만으로 조합되었다고 생각해 본다면.

Core0는 
1. a 라는 변수에 1이라는 수를 저장하고(또는 Store or Write하고)
2. b 라는 변수에 1을 저장하라

라는 프로그래머의 의도를 무시하고 자신 이외의 코어인 Core1과의 메시지 교환 때문에 b = 1을 먼저 실행한 것이다.

이 상황을 바로 *Store Reordered After Store* 이라고 말한다

프로그래머 입장에서 문제는 바로 이제부터 시작한다...
## 아키텍처에 따른 특징
문제는 바로 이 CPU에서 허락하는 Memory Reorder가 *아키텍처* 별로 상의하다는 것이다;;;

![image-20240316131112220.png|center|300](/img/user/kr/%EA%B8%B0%EB%A1%9D/%EB%85%BC%EB%AC%B8/assets/Paper%20Review%20-%20Memory%20Barriers%20a%20Hardware%20View%20for%20Software%20Hackers/image-20240316131112220.png)
\[~~Holy - moly Guacamole!!~~\]

아키텍처 별로 이렇게 상의한 특징을 가지는 이유는 바로 *최적화* 때문이다.

회사별로 서로 다른 명령어 처리 방식으로 인해서 생기는 문제이다...
(~~고오오오급 프로그래머의 길은 멀고도 험하다~~)

우리는 여기서 가장 간단한 [x86을 기준으로 알아볼 것이다.](https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html)

가장 간단하게 Load after Load와 Store after Store의 경우에 대해서만 살펴보자

![image-20240316132454514.png](/img/user/kr/%EA%B8%B0%EB%A1%9D/%EB%85%BC%EB%AC%B8/assets/Paper%20Review%20-%20Memory%20Barriers%20a%20Hardware%20View%20for%20Software%20Hackers/image-20240316132454514.png)
\[출처 - Intel® 64 Architecture Memory Ordering white paper\]

x86에서 허락하지 않는 동작은 다음과 같다.

먼저 Store after Store에서 허가되지 않은 동작이 실행되면 

1. mov \[\_y\], 1 이 먼저 실행된다
	1. 현재 \[\_y\] == 1, \[\_x\] == 0이 저장된 상태이다
2. Processor 1이 실행된다
	1. r1 == 1, r2 == 0 이 된다

다음으로 Load after Load의 경우에도 간단하게 생각해 볼 수 있다

1. mov r2, \[\_x\] 이 먼저 실행된다
2. 다음으로 Processor0이 실행된다
	1. 현재 \[\_x\] == 1 \[\_y\] == 1 이다
3. 다음으로 mov r2, \[\_x\]이 실행된다
4. r1 == 1, r2 == 0이다 

즉 x86에서는 이러한 동작이 허가되지 않는 것이다.

하지만 위 표에서 잠깐 언급하였듯, 이 모든 동작이 허용되는 아키텍처의 CPU도 존재한다!!

그런데 우리는 이러한 CPU의 구조를 의식하면서 프로그래밍을 하고있는가를 생각하면 꼭 그렇지도 않는것 같다.

어떻게 그런 일이 가능한 것일까?
## 운영체제와 언어에서 메모리를 다루는 방법
사실 어떠한 언어를 배우거나 운영체제를 공부할 때 이러한 내용을 배우지 않는 이유는 간단하다.

당연하게도 운영체제와 언어에서 제공하는 인터페이스가 적절하게 *추상화*되어 있기 때문이다.

Linux에서는 이러한 메모리 베리어에 대한 직접적인 컨트롤을 할 수 있는 함수를 제공하고 있다.

하지만 우리가 사용하는 여러 동기화와 관련된 함수에서 평소에 이러한 내용을 의식하지 않는 이유는, 아키텍처와 상관없이 모든 경우의 수를 고려하여 동기화 코드를 작성할 수 있도록 함수 내부가 작성되어 있기 때문이다!!

또한 언어에 따라서 멀티 쓰레딩 기능을 지원하는 언어들이 늘어나고 있는데 이러한 언어들 또한 CPU의 아키텍처를 고려하지 않을 수 없다.

그렇기 때문에 프로그래밍 언어들 또한 메모리 모델을 고려하여 기능들을 제공하고 있다.

## 더 알아보기
1. [Intel에서 제공하는 메모리 배리어 명령어는 뭐가 있을까?](https://www.intel.com/content/dam/www/public/us/en/documents/manuals/64-ia-32-architectures-software-developer-vol-2b-manual.pdf)
2. 소개한 논문 읽기에 도전!
	1. 특히 논문에서 소개하는 CPU 중 SPARC 아키텍처에 대해서 자세히 읽어보기
3. 추가로 읽으면 좋을지도??.. [[kr/운영체제/동기화의 본질 - SW와 HW 관점에서\|동기화의 본질 - SW와 HW 관점에서]]
# Reference
1. https://www.puppetmastertrading.com/images/hwViewForSwHackers.pdf