---
{"dg-publish":true,"permalink":"/kr/지식나눔/DFRWS 2023 Challenge Write-up (2)/","created":"2025-02-07","updated":"2025-02-07"}
---

[[kr/지식나눔/DFRWS 2023 Challenge Write-up (1)\|첫 포스팅]]에 이어서 계속해서 풀이를 진행하도록 하겠습니다.

저번 포스팅에서 Challenge 분석을 위한 배경지식을 설명하였다면, 이번 포스팅에서는 본격적으로 Challenge를 어떻게 진행하였는지 설명하도록 하겠습니다.

# 공격의 타임라인
우선 큰 그림을 그리기 위해서 CEO를 향한 이벤트의 타임라인을 간략히 정리하고 시작하겠습니다.

CEO를 향한 공격은 다름과 같은 타임라인을 따라서 진행되었습니다.

1. 2023-06-22일: 이메일을 통한 협박
2. 2023-06-29일: 엘리베이터 PLC를 향한 공격 발생
	1. 15:00 - PLC 메모리에 변조 발생
	2. 15:10 - CEO가 엘리베이터에 탑승
	3. 15:11 - 엘리베이터가 2.5층에서 정지
	4. 15:25 - PLC 메모리에 변조 발생
	5. 15:29 - 엘리베이터 문이 열리지 않는 문제 발생
	6. 15:44 - PLC 메모리가 최초 (공격 전) 상태로 복원
	7. 15:45 - CEO 구출

타임라인 분석을 위해서 사용한 데이터는 아래 표와 같습니다.

| **Challenge 데이터** | **추출한 정보**                     |
| ----------------- | ------------------------------ |
| CEO 데스크탑 메모리 덤프   | 협박 메일의 내용과 전송 시점               |
| 네트워크 로그           | PLC 메모리 쓰기를 인터넷을 통해 시도한 흔적과 시점 |
| PLC 메모리 덤프        | 조작된 PLC 로직에 대한 정보              |

정확한 타임라인은 CCTV 영상과 네트워크 로그의 타임스탬프를 비교하여 설정되었습니다.

![[image-20250211200012258.png \| center]]

CCTV 영상의 시간을 기준으로 위 시간이 PLC 메모리를 대상으로 쓰기 명령이 내려진 시점이 되겠습니다.

결론적으로 Challenge 해결을 위해서 분석해야 할 요소는 크게 두 가지로 

1. PLC 로직: PLC의 어떤 부분이 조작되었고, 조작된 부분이 어떻게 영향을 미쳤는가
2. 네트워크: Network 를 통한 PLC 조작이 어떤 방식으로 이루어졌는지

이 두 가지가 문제 해결을 위해서 중점적으로 살펴봐야 할 부분이 되겠습니다.

# PLC 로직 분석
지금까지의 내용을 간략히 추리면, 네트워크를 통한 PLC 메모리의 변조가 발생하였고 그로 인해 PLC의 동작 로직이 변경되었고, 오작동을 유발하게 되었다고 이해할 수 있습니다.

그렇다면 변경된 로직에 의한 엘리베이터의 동작은 어떻게 변화하였고, 메모리의 어느 부분의 변화가 이러한 변화를 이끌었는지 살펴보도록 하겠습니다.

그러기 위해서 우선, 엘리베이터의 변경된 동작에 대해서 시각적으로 이해하도록 하겠습니다.

## 엘리베이터 동작 관찰 결과

우선 Challenge에서 엘리베이터에 대한 동작은 3가지 타입으로 구분할 수 있습니다.

3. type1 - 정상적으로 작동하는 경우
4. type2 - 엘리에이터를 중간층 (2.5 층)에 30분간 정지한 후 동작
5. type3 - 엘리에이터가 움직이는 도중 엘리베이터의 문이 열리고 도착 시 문이 닫히는 동작

| **Type 2**                                                       | **Type 3**                                                  |
| ---------------------------------------------------------------- | ------------------------------------------------------------ |
| The error when the elevator stops suddenly when it is unexpected | The mistake of doors being open while the elevator is moving |
| ![image-20250213123100169.png](/img/user/kr/%EC%A7%80%EC%8B%9D%EB%82%98%EB%88%94/assets/DFRWS%202023%20Challenge%20Write-up/image-20250213123100169.png)<br><br>                         | ![image-20250213123106323.png](/img/user/kr/%EC%A7%80%EC%8B%9D%EB%82%98%EB%88%94/assets/DFRWS%202023%20Challenge%20Write-up/image-20250213123106323.png)<br><br>                     |

CCTV 영상에서 엘리베이터는 동작은 type1 ➡️ type2 ➡️ type3 ➡️ type1 순으로 변화하였고, 각 동작의 변화가 발생한 시점에 PLC을 대상으로 UMAS Function Code 0x29의 (메모리 쓰기 요청)이 발생하였음을 확인할 수 있었습니다.


## PLC의 동작
이제 본격적으로 PLC 의 동작 변화에 대해서 이해하기 위해서 다음과 같은 정보를 수집한 후 Challenge를 진행하였습니다.

### PLC 메모리의 구조와 분석
[[kr/지식나눔/DFRWS 2023 Challenge Write-up (1)\|Part 1]]에서 언급한 네트워크의 Function code 중 PLC와 관련한 정보를 요청하는 코드가 있다고 설명해 드렸습니다. 바꾸어 말하면 PLC의 어딘가에서 해당 정보를 보관하고 있다고 요청이 들어왔을 시 해당 정보를 반환한다고 생각할 수 있죠.

PLC상의 어디에 어떤 데이터가 저장되어있는지 알기 위해서 최근에 발행된 논문, 블로그 등을 참조하여서 PLC 메모리 상에서 분석에 필요한 데이터 확보가 가능한 것을 확인하였고, 주어진 메모리 덤프 파일에서 데이터를 추출할 수 있었습니다.

> [!reference]
> 1. Kalle, S., Ameen, N., Yoo, H., & Ahmed, I. (2019, February). CLIK on PLCs! Attacking control logic with decompilation and virtual PLC. In _Binary Analysis Research (BAR) Workshop, Network and Distributed System Security Symposium (NDSS)_ (pp. 1-12).|
> 2. Awad, R. A., Rais, M. H., Rogers, M., Ahmed, I., & Paquit, V. (2023). Towards generic memory forensic framework for programmable logic controllers. _Forensic Science International: Digital Investigation_, _44_, 301513
> 3. Zubair, N., Ayub, A., Yoo, H., & Ahmed, I. (2022). PEM: Remote forensic acquisition of PLC memory in industrial control systems. _Forensic Science International: Digital Investigation_, _40_, 301336.|
> 4. Ayub, A., Jo, W., Qasim, S. A., & Ahmed, I. (2023). How are industrial control systems insecure by design? A deeper insight into real-world programmable logic controllers. _IEEE Security & Privacy_.|


| **No** | **Memory Name** | **Given Data** | **Memory Offset**     | **Contained Data**                                                                        |
| ------ | --------------- | -------------- | --------------------- | ----------------------------------------------------------------------------------------- |
| 1      | On-chip RAM     | OnChipRAM_**   | 0x0000 – 0x1FFFF      | First configuration block (config1) and PLC network information                           |
| 2      | External RAM    | ExtRAM_**      | 0x7000000 – 0x707FFFF | Second configuration block (config2), metadata file (entry), control logic, and data file |
\[주어진 PLC 메모리 덤프에 대한 설명과 확인가능한 데이터\]

우선 데이터 추출을 위해서 Binwalk를 이용하여, 메모리상의 압축된 메타데이터를 추출할 수 있습니다.
![[image-20250213122645526.png \| center]]
\[Output of binwalk\]

![[image-20250213122705842.png \| center]]
\[Extracted metadata\]

그리고 추출된 데이터에서는 프로젝트명, in/ouput을 위해 사용되는 레지스트리에 대한 정보, Rung에 대한 정보 등을 확인할 수 있었습니다.

구체적인 데이터는 아래와 같습니다.

(Comment에 남겨진 설명으로 대략 어떠한 역할을 수행하는지 확인할 수 있으실 겁니다)

| **Metadata code**                        | **Section number** | **POU name**  |
| ---------------------------------------- | ------------------ | ------------- |
| ![image-20250213123011876.png](/img/user/kr/%EC%A7%80%EC%8B%9D%EB%82%98%EB%88%94/assets/DFRWS%202023%20Challenge%20Write-up/image-20250213123011876.png)<br><br> | 1                  | What Floor    |
| ![image-20250213123018254.png](/img/user/kr/%EC%A7%80%EC%8B%9D%EB%82%98%EB%88%94/assets/DFRWS%202023%20Challenge%20Write-up/image-20250213123018254.png)<br><br> | 2                  | First Called  |
| ![image-20250213123024224.png](/img/user/kr/%EC%A7%80%EC%8B%9D%EB%82%98%EB%88%94/assets/DFRWS%202023%20Challenge%20Write-up/image-20250213123024224.png)<br><br> | 3                  | Second Called |
| ![image-20250213123028725.png](/img/user/kr/%EC%A7%80%EC%8B%9D%EB%82%98%EB%88%94/assets/DFRWS%202023%20Challenge%20Write-up/image-20250213123028725.png)<br><br> | 4                  | Third Called  |
| ![image-20250213123033511.png](/img/user/kr/%EC%A7%80%EC%8B%9D%EB%82%98%EB%88%94/assets/DFRWS%202023%20Challenge%20Write-up/image-20250213123033511.png)<br><br> | 5                  | Floor Display |
| ![image-20250213123039987.png](/img/user/kr/%EC%A7%80%EC%8B%9D%EB%82%98%EB%88%94/assets/DFRWS%202023%20Challenge%20Write-up/image-20250213123039987.png)<br><br> | 6                  | Elevator Door |
\[Metadata of program organization units (POUs) \]

해동 표에서 새롭게 등장하는 POU라는 건 어려울 것 없이 Rung들의 모임이라고 생각하시면 됩니다 ;)

마지막으로 In / Output과 관련한 레지스트리 값 또한 추출할 수 있습니다.

> [!warning]
> 아래 표의 In / Output은 PLC의 Rung이라느 개념을 설명하기 위해 언급한 In / Output과는 다른, 실제 엘리베이터에 장착된 센서에 의한 입력값과 엘리베이터 모터의 동작을 조작하기 위한 출력값을 의미합니다.

| **Index** | **Input**                    | **Output** | **Memory** |
| --------- | ---------------------------- | ---------- | ---------- |
| 0         | Limit Switch Floor 1         | Up         | F1CALL     |
| 1         | Limit Switch Floor 2         | Down       | F2CALL     |
| 2         | Limit Switch Floor 3         | FD_C       | F3CALL     |
| 3         | Door Limit Close             | DOOR_OPEN  | At Floor 1 |
| 4         | No External Calling Button 4 | FD_AGD     | At Floor 2 |
| 5         | External Calling Button 1    | FD_E       | At Floor 3 |
| 6         | External Calling Button 2    | DOOR_CLOSE | F4CALL     |
| 7         | External Calling Button 3    | -          | ATF4       |
| 8         | Door Limit Close             | -          | DOOR_CNT   |
| 9         | -                            | -          | F1LATCH    |
| 10        | -                            | -          | F2LATCH    |
| 11        | -                            | -          | F3LATCH    |
| 12        | -                            | -          | SAME_CALL  |
\[Information describing the input/output of the PLC\]

다음 섹션으로 가기 전, 약간의 부가적인 설명을 덧붙이자면, PLC에서 각 센서 입력과, 엘리베이터 조작을 담당하는 모터 등의 조작은 메모리 또는 레지스트리와 1:1 대응하여 동작하게 됩니다. 

간단히 예를 들어 설명하자면, 엘리베이터의 문의 동작과 관련한 모터를 작동시키고 싶은 경우 DOOR_OPEN 에 대응하는 레지스터 또는 메모리를 1 (다른 표현으로는 True, On 으로) 로 설정한다고 생각하시면 편하실 겁니다.

>[!tip]
>운영체제를 잘 아시는 분이라면 당연하다고 생각하실 수 있습니다만, 혹시 관련한 지식이 없으시다면 IOMMU, DMA 등을 검색해 보시면 앞으로의 이야기가 조금 더 쉽게 이해하실 수 있을 겁니다!

마지막으로 추출된 메타데이터에서 확인할 수 있는 정보는 Function block 였습니다.

Function block 은 Rung의 로직 구성에 사용되는 특수한 기능을 가진 block이라고 이해하시면 편합니다.

예를 들어, 엘리베이터의 문을 전부 열고난 후, 해당 상태를 10초 정도 유지한 후 문을 닫고 싶을 때 사용할 수 있는 타이머 등을 떠올리시면 됩니다.

메타데이터의 Function block은 예상하였다시피 대부분 타이머로 구성되어 있었습니다. 
(앞서 언급한 예시를 생각하면 자연스럽게 타이머의 사용처가 어디인지 예상하실 수 있으실 겁니다)

| **Function Block** | **Preset** | **Base**        |
| ------------------ | ---------- | --------------- |
| Timer0             | 10         | OneSecond       |
| Timer1             | 1000       | OneMilliSeconds |
| Counter0           | 1          | -               |
### PLC 의 CPU 아키텍처와 어셈블리 추출
다음으로 추출한 데이터는 실제 PLC의 동작과 관련한 Control logic 입니다.

Control logic의 경우 External Ram에 존재하고, Control logic의 저장 위치와 크기에 관한 정보는 On-chip Ram에서 확인할 수 있습니다.


![[image-20250213131014061.png \| center]]
\[Identification of the address where the PLC code is stored and its size within the external RAM\]

로직 추출을 위해선 PLC에 사용된 CPU에 맞게 바이너리 데이터를 어셈블리로 추출할 필요가 있습니다.

Challenge에 제시된 PLC에 적용된 CPU는 우리가 흔히 접하는 Intel 또는 AMD의 CPU 가 아닌 **Renesas Electronics**사의 임베디드용 CPU를 사용하고, CPU의 아키텍처 또한 RX630이라는 생소한 이름의 아키텍처를 사용하게 됩니다.

다행히 Renesas 홈페이지에서 RX630 아키텍처 전용 bintools을 배포하고 있어 해당 툴을 이용해서 디스어셈블링을 진행할 수 있습니다.

>[!info] bintools의 설치가 귀찮으신분들은
> 추출된 어셈블리 파일은 또한 github에  \~\~.bin.objdump 파일을 참조하시면 살펴보실 수 있습니다
>(https://github.com/gangjeuk/DFRWS2023-The-Troubled-Elevator-solve/tree/main/1.%20Parser_and_simulator/resource)

![[image-20250213131617641.png \| center]]
\[추출된 어셈블리와 대응되는 Rung\]
### 추출된 어셈블리와 Rung 과의 1:1 매칭
이후 Rung, POU, Control Logic 대해 분석하고 이해하기 위해서 선택한 방법은 단순히 시뮬레이팅을 진행하는 방식을 선택하였습니다.

블로그에서는 분석 결과만을 설명하기 때문에 어셈블리 분석과 관련한 내용을 담는 것은 의미가 없기 때문에 생략하였지만, Challenge의 리포트 작성을 위해서는 어셈블리의 내용을 분석하고 의미가 불분명하거나 확실하지 않은 부분을 전부 이해하여야했기 때문에 이러한 접근법을 선택하여 진행하였습니다.

예를 들어, In/Output에서 열거된 DOOR_CLOSE, UP, DOWN의 경우 엘리베이터의 모터의 동작이겠다고 예상이 가능하지만, FD_AGD, Limit Switch Floor, F1LATCH 등과 같이 의미가 불분명하거나, 애매모호한 부분이 존재하였습니다.

시뮬레이팅을 위해서 어셈블리 코드를 C 언어로 번역한 후 동작을 관찰하는 식으로 불분명한 부분들을 확인해 나갔습니다.

예를 들어 외부 호출을 뜻할 것으로 예상되는 External Calling Button의 분석을 위해서 시뮬레이션에서 동작하는 엘리베이터 동작을 간단히 작성한 후 동작 로그를 관찰하였습니다.

![[image-20250213133613532.png \| center]]
\[Analysis of the function for the External Calling Button\]

우선 첫 초기 상태를 1층으로 설정할 수 있도록 합니다 (코드의 5-6줄). 이후 PLC의 loop 를 반복하여 (코드의 what_floor 함수) 출력되는 로그를 통해서 엘리베이터의 상태를 관찰할 수 있습니다.

만약 External Calling Button이 우리가 상정하고 있는 동작인 외부에서 호출을 의미한다면 예상되는 엘리베이터의 동작은 First floor (initial setting) ➡️  Calling the second floor ➡️  Lifting up 과 같이 동작할 것임을 예측할 수 있습니다.

그리고 실제로, 로그를 통해서 1층의 엘리베이터가 2층의 External Calling Button 눌렸을 시에 UP (엘리베이터를 위로 옮기는 모터) 가 동작하는 것을 확인할 수 있습니다.

즉 예상하던 대로 External Calling Button은 외부 호출 버튼이었던 것이죠!

이런 식으로 메타데이터 기록된 Input, Output, Rung에 대한 조사를 진행하였습니다.

| **In/Output** | **H/W Spec.**                   | **Config Comment**      |
| ------------- | ------------------------------- | ----------------------- |
| Input         | Floor Positioning Signals       | Limit Switch Floor      |
|               | Door Closing Positioning Signal | Door Limit Close        |
|               | Door Opening Positioning Signal | Door Limit Open         |
|               | External Calling Button         | External Calling Button |
| Output        | Lifting Control Signal Up       | Up                      |
|               | Lifting Control Signal Down     | Down                    |
|               | Door Opening Control Signal     | Door Open               |
|               | Door Closing Control Signal     | Door Close              |
|               | Floor Display Signals           | FD_C / FD_AGD / FD_E    |
\[Elevator Spec. & PLC metadata\]

결론적으로는 다수의 Rung을 분석하여 엘리베이터 문의 동작, 위 / 아래의 이동과 관련한 Rung 들을 관찰할 수 있었고 공격으로 인해 교체된 Rung의 대다수가 이러한 엘리베이터의 동작과 관련된 Rung 이었음을 확인할 수 있었습니다.

반대로 엘리베이터의 위치를 나타내는 Floor display와 관련된 Rung은 공격의 대상이 아니었습니다.

### 분석 자동화
이렇게 시뮬레이팅을 통해 엘리베이터와 관련한 다양한 정보를 획득한 후에, 드디어 실질적인 공격을 분석하기 위해선 분석에 앞서 분석의 자동화를 진행하여야 했습니다.

왜냐하면, 주어진 바이너리에서 총 4번의 코드 변화가 관찰되었고, 각 변화가 어떠한 영향을 미치는지 확인하기 위해서 어셈블리를 분석하는 것보다 앞서 사용한 시뮬레이터를 활용하는 것이 효율적이라고 판단되었기 때문입니다.

더해서 리포트에 추가할 내용에 대한 설명 또한 어셈블리의 로직에 대한 설명이 아닌 실제 엘리베이터의 동작에 대한 설명으로 치환하여 설명할 수 있다는 것도 메리트였기 때문에 이러한 접근을 사용하였습니다.

결과적으로 앞서 C 언어로 작성한 엘리베이터 하드웨어를 실제로 모방한 코드를 별도의 [라이브러리](https://github.com/gangjeuk/DFRWS2023-The-Troubled-Elevator-solve/blob/main/1.%20Parser_and_simulator/simulator/simulator.h)로 분리하고 Python을 통해 어셈블리를 시뮬레이터에서 동작가능한 C 코드로 트랜스파일링 (? 맞는 용어인지는 모르겠네요;;) 하는 [스크립트](https://github.com/gangjeuk/DFRWS2023-The-Troubled-Elevator-solve/blob/main/1.%20Parser_and_simulator/generator.py)를 별도로 제작하였습니다.

마지막으로 라이브러리와 변환된 코드를 [링크하여](https://github.com/gangjeuk/DFRWS2023-The-Troubled-Elevator-solve/blob/main/1.%20Parser_and_simulator/simulator/compile.sh) [사용하는](https://github.com/gangjeuk/DFRWS2023-The-Troubled-Elevator-solve/blob/main/1.%20Parser_and_simulator/run_simul.sh) 방식으로 조작된 엘리베이터의 동작 변화를 쉽게 관찰할 수 있었습니다. 

결론적으로 작성된 시뮬레이터 (에뮬레이터?)를 통해 확인할 수 있는 출력 로그는 아래와 같습니다.

![[image-20250218124955784.png \| center]]
\[Normal operation of the elevator\]

위 로그는 엘리베이터를 1층에서 3층의 외부 호출을 통해 호출하는 경우에 출력되는 로그입니다. 

일반적인 엘리베이터의 동작처럼 1층에서 3층으로 호출된 이후 1층에서 3층으로 이동 ➡️ 3층 도착 이후 문 열리기 시작 ➡️ 문이 열린 후 3초 타이머 작동 ➡️ 3초 이후 엘리베이터 문 닫힘과 같이 동작함을 확인할 수 있습니다.

### 공격 내용 분석

이제 주어진 시뮬레이터를 통해서 변경된 엘리베이터의 PLC 로직을 간단히 살펴보도록 하겠습니다.

주어진 PLC 메모리 덤프 데이터의 어셈블리를 기준으로 엘리베이터의 로직은 총 4번 변화하였습니다.

![[image-20250218131142173.png \| center]]
\[Comparison between different versions of the code extracted from memory dumps\]

#### Ver.2 2nd attack

두 번째 공격의 경우 Third call 이라는 POU를 대상으로 조작이 이루어졌고, 추가로 attaxk 이라는 메모리 플래그가 추가 되었습니다.

공격 내용을 어셈블리와 시뮬레이션을 통해 확인한 결과 attaxk이라는 메모리 플래그가 On으로 변화하였을 시 엘리베이터를 30분간 정지시키는 것이 주된 동작임을 확인할 수 있었습니다.

![[image-20250218131810653.png \| center]]
\[Ver.2 operation of the elevator\]

![[image-20250218131819356.png \| center]]
\[Ver.2 operation of the elevator with debug messages\]

#### Ver.3 3rd attack
마지막 공격의 경우는 엘리베이터의 문과 관련된 POU를 조작하여 엘리베이터가 위 / 아래로 이동하고 있을 시에 엘리베이터의 문이 열리게하고, 도착하였을 시 문이 닫히도록 조작된 것이 주된 변경 점이었습니다. 

(실제 상황이라면 좀 무서울 것 같네요;;)

![image-20250218132117670.png](/img/user/kr/%EC%A7%80%EC%8B%9D%EB%82%98%EB%88%94/assets/DFRWS%202023%20Challenge%20Write-up/image-20250218132117670.png)
\[Ver.3 operation of the elevator\]


# 네트워크 분석
네... 지금까지 PLC 분석을 읽으시느라 고생하셨습니다!

마지막으로 네트워크를 통한 공격이 어떻게 이루어졌는지만 살펴보면 DFRWS Challenge에서 살펴볼 내용은 거의 끝났다고 할 수 있습니다.

사실 리포트에서는 길게 작성하였지만, "메모리에 데이터를 썼다" 정도의 내용이기 때문에 가볍게 읽어주시면 되겠습니다.

## 패킷 분석
우선 패킷 분석의 경우 앞서 언급한 lua 스크립트를 사용하여 Function code를 기준으로 패킷 필터링을 진행하였습니다.

여러 Function code와 패킷 송수신 패턴을 살펴보았지만 큰 유의미한 고찰은 얻지 못했기 때문에 결국 중요하게 살펴보아야 하는 부분은 Write 와 관련한 Function code 0x29의 패킷에 대한 부분이 되겠습니다.

## 'Write Function' attack
팀 내에서는 이러한 메모리 쓰기 공격을 Write Function attack이라고 명명하였고, 해당 Function code의 패킷이 송신된 이후의 PLC 메모리, 패킷에 실린 데이터 등을 분석하여 Write Function의 구조가 다음과 같음을 알아낼 수 있었습니다.

![image-20250218133403189.png](/img/user/kr/%EC%A7%80%EC%8B%9D%EB%82%98%EB%88%94/assets/DFRWS%202023%20Challenge%20Write-up/image-20250218133403189.png)
\[Structure of the UMAS ‘Write to memory blocks’ packet\]

결론적으로는 단순하게 쓰기를 진행하는 위치 (offset), 크기 (size) 그리고 데이터 (data) 로 이루어진 구조였습니다.

(~~조사 시의 들인 노력과 별개로 결론은 항상 단순하네요 ㅎㅎ~~)

이러한 결론을 바탕으로 메모리에 어떠한 데이터가 어떻게, 언제 교체되었는지 확인할 수 있었습니다.

# 후기

긴 글 읽으시느라 고생하셨습니다 👏👏👏

대회 문제와 관련된 풀이는 리포트에 있기 때문에 후에 허락을 받아 올릴 수 있으면 올리도록 하겠습니다.

