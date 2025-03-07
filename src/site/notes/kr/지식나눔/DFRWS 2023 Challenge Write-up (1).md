---
{"dg-publish":true,"permalink":"/kr/지식나눔/DFRWS 2023 Challenge Write-up (1)/","created":"2025-02-07","updated":"2025-02-07"}
---

![[image-20250210154557360.png \| center]]


# 참고 링크
- Problem github: https://github.com/dfrws/dfrws2023-challenge
- Write-up github: https://github.com/gangjeuk/DFRWS2023-The-Troubled-Elevator-solve

# 잡담
최근에 올린 [[kr/일기/2025-02-07 (근황 및 일정 설명)\|글]]에서 말씀 드렸던  DFRWS 2023 Write-up을 드디어 올립니다. 결과가 얼마 전에 나와서 드디어 Write-up을 올리게 될 수 있게 되었습니다.

가능하면 리포트까지 공유드릴 수 있으면 좋을 것 같지만, 이 부분은 추후에 팀원분들의 동의를 받고 올릴 수 있으면 올리도록 하겠습니다!

길었다면 길었고 짧았다면 짧았던 대학원 생활에서 제가 남긴 결과를 여러분들과 나눌 수 있어서 참 기쁜 마음입니다.

얼마나 많은 분들이 글을 읽으실지는 모르겠지만, 혹시나 보안 또는 포렌식에 관심이 있으신 분들에게 흥미가 가는 글이면 될 수 있으면 좋겠다라는 마음으로 Write up 작성하였습니다.

그럼 바로 설명을 시작하도록 하겠습니다.

# 문제 설명
우선 문제에 대한 이해를 위해서 가볍게라도 문제 링크를 타고 글을 읽는 것이 가장 정확하기 때문에, 자세한 내용은 링크를 참조해주시면 감사하겠습니다.

개괄적으로 문제에 대해서 설명하기위해서 문제를 두 부분으로 나눠 **문제의 스토리**와, **주요 포렌식 대상 (타겟)** 을 구분하여 설명하면 이해가 조금 더 쉬울 것 같습니다.

**주요 포렌식 대상**의 경우 PLC (Programmable Logic Controller) 라는 하드웨어을 대상으로 합니다. PLC의 경우 복잡하게 생각할 필요 없이, 우리 주변의 컴퓨터 또는 임베디드 시스템이라고 생각해주시면 됩니다.

다만 차이점이 있다면 PLC의 경우 여러 산업 현장 등의 신뢰성이 중요한 곳에서 쓰인다는 것입니다.

대표적으로는 우리가 사용하는 엘리베이터 또는 선박 등의 컨트롤을 위해서 사용된다는 것이 특징입니다.

![[image-20250210155639658.png \| center]]

또 다른 특징으로, 단순한 임베디드 시스템과 구분되는 부분은 스크레치 (Scratch) 와 비슷한 인터페이스를 통해서 (프로그래머로 치자면 Code editer 같은 느낌?) 프로그래밍을 할 수 있다는 것입니다.

(물론 PLC 쪽이 조금 더 전문지식을 필요로 합니다, Flop, and \| or \| xor 게이트 등)

![[image-20250210160311846.png \| center]]
\[PLC 하드웨어 이미지\]

예, 왠지 튼튼해보이는 이 물체가 바로 PLC입니다. 

PLC는 방금 말씀드렸듯이, 컴퓨터라고 생각해주시면 됩니다. 다시 말하자면 컴퓨터와 같이 Input / Calculate / Output 이 존재하고, Input을 받아 Calculation을 수행하고 결과를 Output으로 출력을 진행하게 됩니다.

예시로써 언급한 PLC가 사용된다는 엘리베이터를 1층에서 움직여 2층에 도착하는 과정에서 PLC의 동작을 보시면 이해하시기 수월할겁니다.

1. 2층에 도착했음을 감지하는 센서의 Input이 PLC에 전달
2. 2층에 도착했을 시의 로직을 PLC에서 실행
3. 실행된 로직에 따라서 엘리베이터 문을 조작하는 모터에 Output으로써 신호를 전달
4. Output으로 전달된 신호를 모터가 받아 문이 열림

또한 임베디드 시스템과 비슷하게 (조금 더 자세히는 아두이노 프로그래밍과 비슷하게) 프로그래밍 되게 됩니다.

1. 위의 프로그래밍 인터페이스에서 프로그램을 작성
2. 컴파일된 바이너리를 PLC에 저장
3. 저장된 바이너리를 PLC가 실행

과 같이 말이죠.

**문제의 주요 골자**는 바로 이 PLC가 해킹된 상황을 조사한다는 것입니다.

스토리를 단순하게 요약하자면, 가상의 한 회사가 적대적 인수합병을 통해 다른 가상의 회사를 먹어치우려고 한다는 것과 이러한 회사의 행태가 마음에 들지 않은 사람들이 해커를 고용하였고, 고용한 해커가 저지른 사건을 조사하는 것이 저희의 과제가 되게 됩니다.

조금 더 자세히 ==3줄로==요약하자면

1. CEO가 적대적 인수합병하려고 함
2. 이 CEO가 마음에 들지 않은 사람이 해커를 고용해서 협박메일을 보내는 등의 아주아주 나쁜 행위를 함
3. 계약 당일 CEO가 회의장으로 가기위해서 탄 엘리베이터를 해킹해서 오작동을 일으킴

정도로 보시면 됩니다. 

스토리에서는 해커들은 엘리베이터를 컨트롤하는 PLC를 공격대상으로하여 CEO가 회의에 참여할 수 없게 만들어버렸고, 저희는 어떠한 방법과 경로를 통해 공격이 이루어졌는지를 조사하게됩니다.

# PLC와 관련한 배경지식
Write-up의 원할한 이해를 위해서, PLC에 대한 여러 배경지식이 필요하게됩니다.

우선 PLC프로그래밍과 관련한 내용을 약간만 더 첨가하고 해설을 이어가면 좋을 것 같습니다.

### PLC의 동작단위
우선 프로그래밍의 기본 단위인 ==함수==와 같은 개념이 PLC에도 존재하는데, PLC에서는 이것을 Rung이라고 명명합니다.

![[image-20250210162608056.png \| center]]
\[출처 - https://ladderlogicworld.com/programmable-logic-controller-plc-basics/\]

Rung은 함수와 마찬가지로 시작점 (Rung의 왼쪽) 에서의 Input 과, 끝점 (Rung의 오른쪽) Output 으로 구성되고, PLC는 각 Rung을 순차적으로 무한히 실행하는 역할을 수행합니다.

여기서 Rung의 동작이 무한하다는 개념이 조금 햇갈릴 수 있기 때문에 조금만 더 자세히 이야기를 풀어쓰도록 하겠습니다. (시스템 프로그래밍 또는 프로그래밍에서 말하는 poll (또는 polling) 방식과 비슷하기 때문에 해당 지식을 아시면 조금 쉽게 이해할 수 있습니다)

우선 앞서 예를 들었던 1층에서 2층을 향하는 엘리베이터를 예시를 다시 한 번 가져와서 이야기를 설명해보겠습니다.

엘리베이터을 조작하는 PLC는 각 층의 도착을 탐지할 수 있는 Input 센서를 가지고 있을 경우 엘리베이터의 동작을 위한 Rung은 다음과 같이 프로그래밍 될 수 있습니다.

- 2층 도착 센서를 Input 으로 가지고 Output으로 엘리베이터의 위/아래 동작을 담당하는 모터를 Off하는 Rung
	- 2층에 도착했다는 센서의 input에 따라서 엘리베이터를 멈추는데 사용될 수 있습니다
- 모터 동작 상태와 도착 센서, 2개의 Input을 가지고 Output으로 엘리베이터 문 동작을 On 또는 Off하는 Rung
	- 엘리베이터가 도착하고, 움직임이 정지된 상태에서 엘리베이터 문을 여는데 사용될 수 있습니다


위 Rung은 제가 임의로 만든 일종의 예시로써, 다양한 프로그램이 작성될 수 있습니다. 하지만 여기선 중요한 PLC의 특징 2가지에 주목하시면 해설을 조금 더 잘 이해하실 수 있으실 겁니다.

1. 각 Input와 Output은 특정 상태의 On / Off로써 관리된다
	- 조금 더 구체적으로는 특정 메모리의 하나의 bit로써 관리됩니다
2. Input이 일종의 조건문으로써 작동하게된다
	- 즉 Input의 조건이 맞아야지 로직의 실행과 Output 에서의 출력이 이루어지게 됩니다

이러한 특징을 바탕으로, 만약 여러분이 엘리베이터를 조작하는 PLC로직을 만들게 된다면, 예시로 든 2개의 Rung외에 다음과 같은 Rung을 작성될 수 있을겁니다.

- 1 층 도착을 감지하는 Rung
- 2 층 도착을 감지하는 Rung
- ... 층 도착을 감지히는 Rung
- n 층 도착을 감지하는 Rung
- 엘리베이터 문의 열고 / 닫힘을 조절하는 모터의 동작을 설정하는 Rung
- 엘리베이터의 위 / 아래를 조절하는 모터의 동작을 설정하는 Rung
- etc...

PLC 는 이러한 Rung 들을 반복하면서 Input의 조건이 충족될시에 해당 Rung을 동작시킵니다. 마치 2층 도착 센서가 도착을 감지하여야지 동작하는 Rung과 같이 말이죠 ;) 

그리고 Input 의 조건이 맞지 않으면 다음 Rung을 실행시키고 이러한 행위를 PLC는 계속해서 반복하게 되는거지요.

지금까지의 설명한 Rung을 만약 코드로 옮기자면 아래와 같이 정리될 수 있을 것 같습니다. 

``` c
func Rung1(elevator_sensor_input_bit) {
	// elevator_sensor_input_bit is a value of input sensor connected to PLC
	if(elevator_sensor_input_bit){
		// Run logic here

		// Set, memory bit for recording that an elevator has arrived at 2nd floor
		set_output_bit(elevator_position_at_2nd_floor_bit, True)
	}
	return 0
}

func Rung2(input_bit1, input_bit2) {
	// input_bit could be more complicated
	// It could be sensor input value or elevator up / down motor.
	// So meaning of if-statement below could be translated as,
	// open door when an elevator arrived at some floor and up / down motor is not moving
	if(input_bit1 && !input_bit2){
		// Run door open logic
		set_output_bit(move_door_motor_bit, True)		
		
		// Imagine door open timer of an elevator
		timer(5)

		// Finally, close the door
		set_output_bit(move_door_motor_bit, False)
	}
	return 0
}

func Rung3(){
...
}


func main() {
	// Loop Rungs
	while(1){
		Rung1(elevator_sensor_input_bit);
		Rung2(elevator_sensor_input_bit, elevator_up_down_motor_bit)
		Rung3(...)
		// ...
		RungN(...)
	}
}
```
### PLC 관련 잡담 (해설과 무관..)
원래 PLC 자체는 굉장히 오래된 물건인데, 문제를 풀면서 찾아보니 생각보다 학회에서 핫한 주제중 하나여서 조금 놀랐습니다.

교수님들에게 질문하고 문제 해결을 위해서 여러 논문을 찾으면서 느낀 트렌드는, 최근에 PLC 같은 레거시 하드웨어들이 "인터넷에 연결되기 시작하면서 해킹 등의 위협에 노출되기 시작했다\~\~" 이런느낌으로 IoT 분야와 비슷하게 취약점 발견 등이 이루어지고 있는 필드가 된 것 같습니다.

또한 당연하게도, 문제 출제진들의 논문도 찾아봤는데, 관련 논문을 내신것을 확인하여 문제 해결에 많은 힌트를 얻었습니다. 관심있으신 분들은 논문들도 찾아보시면 조금 더 흥미롭게 해설을 읽으실 수 있을 것 같습니다!

# PLC와 네트워크 (UMAS 프로토콜)
PLC와 관련한 마지막 배경 지식으로 PLC에 저장된 프로그램 등을 업데이트 하는 데 사용되는 UMAS 프로토콜에 대해서 간단히 설명하도록 하겠습니다.

## UMAS (Modbus / TCP based protocol)
우선 UMAS 라는 프로토콜이 생소하신분이 많을 것 같습니다. 저도 Challenge 내용을 공부하면서 처음 접했기 때문에 공부를 하면서 과제를 진행하였습니다.

구체적인 프로토콜의 규약과 관련된 공식문서를 다루기 보다는 간단하게 UMAS에 관련한 내용을 열거하는게 이해가 빠르실 것 같습니다.

우선 결론만 간단하게 요약하자면 UMAS (Unified Messaging Application Services) 프로토콜은 PLC, 더 구체적으로는 Challenge에서 제시된 Schneider Electric 사의 PLC의 설정 변경, 프로그램 업데이트, 바이너리 업데이트 등의 설정을 위해서 사용되는 프로토콜이라고 생각하시면 됩니다.

Application Service 라는 이름에서 알 수 있듯이 어플리케이션 레이어에 위치한다는 것을 예측하실 수 있으실 겁니다. 

아래 계층의 Modbus / TCP 라는 프로토콜 위에서 성립됩니다만 단순히 TCP / IP 위에서 성립한다고 생각하셔도 무방합니다.

> [!info]	
> 1. Modbus 프로토콜은 산업계에서 널리 사용되는 통신 프로토콜 (Fieldbus라는 이름으로 통칭됩니다) 이라고 생각하시면 됩니다
> 2. 시리얼 통신에서부터 TCP / IP 위의 어플리케이션 레이어 까지 다양한 스펙이 정의되어있는 특이한 프로토콜입니다

Challenge에서도 주어진 파일 중 네트워크 로그를 조사하면 PLC의 IP 주소를 대상으로 UMAS 통신이 이루어졌음을 확인할 수 있습니다.

![[image-20250211165746666.png \| center]]

## UMAS에 대한 자세한 내용
UMAS에 대한 자세한 내용과 더불어서, Challenge에서 주어진 와이어샤크 파일(.pcap 파일)을 보기 쉽게하기 위해서는 아래의 주소를 참조해주시면 됩니다.

3. UMAS 분석1: https://ics-cert.kaspersky.com/publications/reports/2022/09/29/the-secrets-of-schneider-electrics-umas-protocol/
4. UMAS 분석2: http://lirasenlared.blogspot.com/2017/08/the-unity-umas-protocol-part-i.html
5. Lua 코드: https://github.com/gangjeuk/DFRWS2023-The-Troubled-Elevator-solve/blob/main/4.%20Modbus%20Wireshark/modbus.lua
	1. 위 코드는 UMAS를 분석한 UMAS 분석을 진행한 저자가 작성한 내용에 더해서 추가적인 코드를 약간 더한 Wireshark용 lua 스크립트입니다

Write-up의 이해를 위해서 간단히 UMAS에 대해서 설명하자면, UMAS는 기본적으로 Function code와 그와 관련된 데이터를 전송하여 PLC를 조작하게됩니다.

![[image-20250211170705075.png \| center]]

예를 들어 PLC의 특정 메모리 영역에 데이터를 쓰고 싶은 경우에는 Function code를 0x29로 설정하고 쓰고 싶은 데이터를 Data 에 같이 넣어 전송하는 방식이라고 생각하시면 됩니다. 

| **UMAS Function Code** | **Function**           |
| ---------------------- | ---------------------- |
| 0x24                   | Read Coils Registers   |
| 0x29                   | Write to memory blocks |
| 0x4                    | Read PLC Information   |
| 0x12                   | Keep Alive Message     |
| 0x2                    | Request a PLC ID       |
\[UMAS의 Function code 와 동작 예시\]

그 외에도 PLC의 하드웨어 정보를 획득하거나, PLC의 레지스터의 값을 Read/Write 하는 경우, 현재 PLC의 상태를 점검하는 등의 기능을 UMAS에서는 정의하고 있습니다.

자세한 Function code와 그 의미는 위의 lua 코드에 정리되어있습니다.

## 5개의 해결 과제와 3개의 파일
지금까지 PLC관련 설명을 이해하시느라 고생 많으셨습니다 👏👏. 우선 Challenge의 내용 설명과 제가 담당한 파트와 해결한 문제의 내용을 간략히 정리하는 것으로 Write-up part 1을 마무리 하도록 하겠습니다. 

Challenge에서 주어진 파일은 크게 3가지 종류로 
1. PLC 메모리 덤프 데이터
2. 경고 메일이 날아온 CEO의 데스크탑의 이미지 파일
3. PLC에 날아온 네트워크 로그 (와이어샤크 데이터)
로 구성됩니다.

해결과제는 PLC가 어떻게 조작당했는지, 범인들의 공격 timeline 등을 구성하는 문제로 구성되었습니다.

결론부터 말씀드리자면 파일 전부를 자세히 살펴보았지만, 특이한 취약점 (예를 들어 CVE를 이용한 공격) 등은 존재하지 않았습니다.

그렇기 때문에 Challenge의 주요 문제가 PLC 메모리 덤프를 해석하는 것이 주요 과제가 되겠습니다. 그리고 제가 주로 담당한 부분이 PLC이기 때문에 다음 part 2에서는 공격의 타임라인을 간략히 설명드리고 PLC를 해석한 과정에 대해서 설명드리도록 하겠습니다.

