---
tags:
  - Computer-Science
  - OS/Basic/BareMetal1
created: 2023-11-07
글확인: true
dg-publish: true
updated: 2023-11-18
cover: "[[Pasted image 20231203165134.png]]"
---

# 베어메탈
베어 메탈이란 아래와 같이 정의 된다.

>[!quote]
>In computer science, bare machine (or bare metal) refers to a computer executing instructions directly on logic hardware without an intervening operating system.

앞에서 운영체제는 프로그램들을 관리하는 프로그램이라고 말하였다.

즉 본질은 프로그램이다. 

C 언어로 작성한 간단한 프로그램을 실제 CPU 위에서 돌려보는 것이 이번 장의 목표이다.

아직은 운영체제라고 말하기에는 어색하지만 [무려 리누스의 리눅스도 터미널 프로그램에서 시작했다!!](https://joone.net/2018/10/22/27-%EB%A6%AC%EB%88%85%EC%8A%A4-%EC%9D%B4%EC%95%BC%EA%B8%B0-%EB%82%98%EB%A7%8C%EC%9D%98-%ED%84%B0%EB%AF%B8%EB%84%90-%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%A8/) 

# 가상환경 준비
우리고 리누스가 되어 CPU에서 간단한 프로그램을 동작시켜 보자.

먼저 준비해야 하는 환경은 다음과 같다

1. QEMU
2. 프로그램 에디터(VScode, Vim, Emacs 등)

## QEMU 설치하기
QEMU는 우리가 직접 컴퓨터를 구매하지 않고도 가상의 컴퓨터를 사용할 수 있게 해주는 가상화 도구이다.

기본적으로 오픈소스이고 윈도우와 리눅스에서 사용할 수 있다.

윈도우의 경우 별도의 WSL 환경을 구축하여 설치하면 간단하게 명령어만으로 설치할 수 있다.

아래 링크를 사용해서 설치하여 보자

<div class="transclusion internal-embed is-loaded"><div class="markdown-embed">



### WSL2
[WSL2 설치](https://www.google.com/search?q=wsl2+install&sca_esv=575552500&ei=AMc0ZdS2Ls-hhwP79qLABw&ved=0ahUKEwjUtq2MiYmCAxXP0GEKHXu7CHgQ4dUDCBA&uact=5&oq=wsl2+install&gs_lp=Egxnd3Mtd2l6LXNlcnAiDHdzbDIgaW5zdGFsbDIFEAAYgAQyBRAAGIAEMgUQABiABDIFEAAYgAQyBRAAGIAEMgUQABiABDIFEAAYgAQyBRAAGIAEMgUQABiABDIFEAAYgARI0xFQkgZY4xBwAngBkAEBmAHCAqABgQqqAQcwLjcuMC4xuAEDyAEA-AEBwgIKEAAYRxjWBBiwA8ICBxAAGA0YgATiAwQYACBBiAYBkAYK&sclient=gws-wiz-serp)

WSL2를 설치하고 설정이 끝나면 

[[kr/C 언어/C 언어와 친해지기 전의 준비#Linux\|C 언어와 친해지기 전의 준비#Linux]]로 넘어간다.

</div></div>


또는 [QEMU 사이트의 다운로드 페이지](https://www.qemu.org/download/)에서도 다운로드 가능하다.

## 프로그램 에디터
프로그램 에디터의 경우 여기서 따로 설명하지는 않고 다양한 에디터를 조사하여 사용하기 편한 걸 선택해서 사용해보자.

일단 처음 프로그래밍을 시작하는 사람에게는 다음과 같은 옵션을 추천한다.
1. [Microsoft - VScode](https://code.visualstudio.com/)
2. [Jetbrain - CLion](https://www.jetbrains.com/ko-kr/clion/) 

이러한 편집 툴 들에 적응이 되고 나면, 아래와 같이 키보드에서 손을 떼지 않고도 사용 가능한 옵션들을 알아보자.

1. [Neovim](https://neovim.io/) (현재 사용 중인 도구)
	1. [[kr/지식나눔/LazyVim 설치 및 설정하기\|LazyVim]] 이 플러그인을 설치하여 사용중이다
2. [Emacs](https://www.gnu.org/s/emacs/)

사실 편집기는 사용하기 편하라고 만든 도구에 불과하다, 메모장이나 [Notepad++](https://notepad-plus-plus.org/) 같은 종류에 상관없이 아무거나 사용하여도 된다!!

# Hello World?
이제 간단한 프로그램을 만들어서 돌려보자.

C언어를 시작하면서 작성했던 프로그램인 Hello World!를 출력하는 프로그램의 코드이다. 

코드는 아래와 같다

```c
// hello.c 
#include <stdio.h> 
int main()
{ 
	printf("Hello World\n"); 
	return 0; 
}
```

과연 이 코드가 작동할 수 있을까?

물론 ==*아니다*==.

그럼 여기서 왜? 라는 질문에 답하여 보자.

지금까지 우리는 C 언어와 운영체제의 역사에 대해서 알아보았다.

지금까지의 내용에서 우리가 알아야 할 내용은 다음과 같다,

1. 운영체제는 추상화를 제공한다
2. Hello World 코드는  `#include<stdio.h>`라는 표준 라이브러리를 사용하고있다
3. 우리가 현재 구성한 QEMU 환경은 아래 사진과 같다

![image-20231106142900672.png|center round|700](/img/user/kr/%EC%9A%B4%EC%98%81%EC%B2%B4%EC%A0%9C/assets/%EB%B2%A0%EC%96%B4%EB%A9%94%ED%83%88%20%EB%B6%80%ED%84%B0(1)%20-%20BIOS%20%EB%B6%80%ED%8A%B8%20Boot%20Loader%EA%B9%8C%EC%A7%80/image-20231106142900672.png)

그리고 현재 전체적인 구성은 다음과 같다.
![image-20231106143025350.png|center round|700](/img/user/kr/%EC%9A%B4%EC%98%81%EC%B2%B4%EC%A0%9C/assets/%EB%B2%A0%EC%96%B4%EB%A9%94%ED%83%88%20%EB%B6%80%ED%84%B0(1)%20-%20BIOS%20%EB%B6%80%ED%8A%B8%20Boot%20Loader%EA%B9%8C%EC%A7%80/image-20231106143025350.png)
왼쪽은 우리가 현재 사용하고 있는 환경이고 오른쪽은 QEMU으로 구성한 환경이다.

뭐가 없을까?
1. *디스플레이*가 없다
2. 키보드가 없다
3. 마우스가 없다
4. *저장장치*가 없다!!

도대체!!!

컴퓨터의 화면은 어떻게 표시될 수 있는 것인가? (`printf`함수를 단순하게 사용하기만 했을 때는 전혀 생각하지 않았던 부분이다!)

그리고 우리가 작성한 코드는 CPU에서 어떠한 순서를 거처 돌아가게 되는 것인가?

애초에 우리가 작성한 코드를 어떻게 QEMU에 읽으라고 **명령**할 수 있을까?

# Toward printing "Hello World!"
컴퓨터의 *시작점은* 무엇일까?

바로 ==BIOS==이다, BIOS란 무엇일까? 위키피디아에 따르면 아래와 같다.
> [!quote] BIOS
> In computing, BIOS (/ˈbaɪɒs, -oʊs/, BY-oss, -⁠ohss; Basic Input/Output System, also known as the System BIOS, ROM BIOS, BIOS ROM or PC BIOS) is firmware used to provide runtime services for operating systems and programs and to perform hardware initialization during the booting process (power-on startup)
[BIOS](https://en.wikipedia.org/wiki/BIOS) - https://en.wikipedia.org/wiki/BIOS

즉 간단한 인/아웃풋 기능을 수행하고, OS를 실행시키고, 하드웨어를 초기화하는 ==펌웨어==이다.

갑자기 펌웨어라는 새로운 단어가 나오더라도 놀라지 마라, 전부 같은 프로그램이라고 가볍게 넘겨도 된다.

여기서 중요한 키워드는 *인/아웃풋 기능*, *OS의 실행*과 *하드웨어의 초기화*이다.

이 세 가지 키워드에 위 질문에 대한 대부분에 대한 답이 존재한다, 하나씩 살펴보자.

## 하드웨어의 초기화 (코드 옮기기)
먼저 여러분이 작성한 코드를 어떻게 옮길 수 있을까?

유선 통신? 무선 통신?, 아니다 아직 여러분의 컴퓨터는 그렇게 똑똑하지 않다.

우리는 *주 기억 장치*(그냥 USB, Floppy Disk, HDD, SSD 등)을 통해서 옮길 것이다.

그림으로 옮기면 다음과 같다.
![image-20231106160103504.png|center round|700](/img/user/kr/%EC%9A%B4%EC%98%81%EC%B2%B4%EC%A0%9C/assets/%EB%B2%A0%EC%96%B4%EB%A9%94%ED%83%88%20%EB%B6%80%ED%84%B0(1)%20-%20BIOS%20%EB%B6%80%ED%8A%B8%20Boot%20Loader%EA%B9%8C%EC%A7%80/image-20231106160103504.png)
흐름을 설명하면 아래와 같다.
1. 먼저 여러분이 작성한 코드를 컴파일한다
2. 컴파일한 바이너리를 저장장치(여기서는 Floppy disk)에 저장한다
3. 그리고 컴퓨터에 인식시킨다(마치 usb를 꼽는것 처럼)

그리고 이제 BIOS가 나설 차례다.

## BIOS
BIOS는 먼저 하드웨어를 인식하고 어떠한 곳에 어떠한 장치가 꽃혀있는지, 만약 RAM 메모리가 있다면 용량은 얼마인지, 모니터, 키보드, 마우스는 연결되어 있는지 등을 확인한다.

아래 그림으로 흐름을 이해하여 보자.
![image-20231106161337381.png|center round|600](/img/user/kr/%EC%9A%B4%EC%98%81%EC%B2%B4%EC%A0%9C/assets/%EB%B2%A0%EC%96%B4%EB%A9%94%ED%83%88%20%EB%B6%80%ED%84%B0(1)%20-%20BIOS%20%EB%B6%80%ED%8A%B8%20Boot%20Loader%EA%B9%8C%EC%A7%80/image-20231106161337381.png)
RAM 하나만으로는 아쉬우니까 다른 하드웨어를 추가하여 보자.
먼저 화면 표시를 위한 모니터.
![image-20231106161758316.png|center round|600](/img/user/kr/%EC%9A%B4%EC%98%81%EC%B2%B4%EC%A0%9C/assets/%EB%B2%A0%EC%96%B4%EB%A9%94%ED%83%88%20%EB%B6%80%ED%84%B0(1)%20-%20BIOS%20%EB%B6%80%ED%8A%B8%20Boot%20Loader%EA%B9%8C%EC%A7%80/image-20231106161758316.png)
그리고 우리가 작성한 코드가 존재하는 저장장치를 추가하면?
![image-20231106161942699.png|center round|600](/img/user/kr/%EC%9A%B4%EC%98%81%EC%B2%B4%EC%A0%9C/assets/%EB%B2%A0%EC%96%B4%EB%A9%94%ED%83%88%20%EB%B6%80%ED%84%B0(1)%20-%20BIOS%20%EB%B6%80%ED%8A%B8%20Boot%20Loader%EA%B9%8C%EC%A7%80/image-20231106161942699.png)

드디어 최신 컴퓨터에서 사용되는 하드웨어를 추가한 그럴듯한(?) 컴퓨터가 완성되었다. 그리고 연결한 하드웨어들을 BIOS가 인식한다는 것도 알았다.

하지만 아직 해결되지 않는 문제가 있다.

스토리지에 우리가 저장한 코드가 저장되어 있고, 스토리지를 BIOS가 인식한다는 것도 알았다.

그런데, 조금만 생각하면 BIOS입장에서는 어떤 데이터가 들어있는지도 모르는 스토리지 인식되었는데 어떻게 이 데이터를 CPU가 읽게 할 수 있을까?

*어디에*, *어떤* 데이터가 존재하는지 BIOS입장에서는 전혀 알 수 없는데 말이다? 

## 부트 로더(코드의 시작점)
사실 정답은 간단하다, 바로 약속을 해두는 것이다.

공학자들은 전 장에서 제시한 문제를 해결하기 위해서 BIOS라는 프로그램이 마지막으로 해야 할 행동을 *약속*하였다.

첫 번째로, BIOS는 [[kr/운영체제/베어메탈 부터(1) - BIOS 부팅 과정과 Boot Loader작성#부록\|지정된 저장장치]]에 존재하는 첫 번째 섹터(0x200, 512 bytes 만큼의 크기를) [[kr/운영체제/베어메탈 부터(1) - BIOS 부팅 과정과 Boot Loader작성#부록\|정해진 주소(0x7c00)]]에 복사/붙여넣기한다. 

두 번째로, BIOS는 정해진 주소로 점프하여 우리(또는 당신이)가 만든 코드가 동작하게 한다!!

그림으로 나타내면 다음과 같다.
![image-20231107143135220.png|center round|700](/img/user/kr/%EC%9A%B4%EC%98%81%EC%B2%B4%EC%A0%9C/assets/%EB%B2%A0%EC%96%B4%EB%A9%94%ED%83%88%20%EB%B6%80%ED%84%B0(1)%20-%20BIOS%20%EB%B6%80%ED%8A%B8%20Boot%20Loader%EA%B9%8C%EC%A7%80/image-20231107143135220.png)
![image-20231107143202779.png|center round|700](/img/user/kr/%EC%9A%B4%EC%98%81%EC%B2%B4%EC%A0%9C/assets/%EB%B2%A0%EC%96%B4%EB%A9%94%ED%83%88%20%EB%B6%80%ED%84%B0(1)%20-%20BIOS%20%EB%B6%80%ED%8A%B8%20Boot%20Loader%EA%B9%8C%EC%A7%80/image-20231107143202779.png)
![image-20231107143801801.png|center round|700](/img/user/kr/%EC%9A%B4%EC%98%81%EC%B2%B4%EC%A0%9C/assets/%EB%B2%A0%EC%96%B4%EB%A9%94%ED%83%88%20%EB%B6%80%ED%84%B0(1)%20-%20BIOS%20%EB%B6%80%ED%8A%B8%20Boot%20Loader%EA%B9%8C%EC%A7%80/image-20231107143801801.png)

이런 과정을 통해서 Floppy disk, USB, HDD 등의 기록장치에 저장된 코드가 처음으로 컴퓨터에서 실행된다.

# 부록
## 저장장치가 여러 개면?
우리가 연결한 장치가 Floppy disk뿐만 아니라 다양한 장치를 연결하면 어떻게 될까?

또는,  Floppy disk를 연결하기 전에 컴퓨터에 HDD가 연결되어 있으면? 

만약에 여러분이 다양한 OS를 설치해서 실행하고 싶으면?

이 문제에 대한 대답은 BIOS가 하드웨어를 초기화한다는데 있다.

BIOS는 장치를 초기화하는 과정에서 이미 어떠한 장치가 연결되어 있는지 인식하고 있기 때문에 BIOS를 통해서 어떤 저장장치를 사용할 것인지 지정할 수 있다.
![image-20231114222459509.png|center round|400](/img/user/kr/%EC%9A%B4%EC%98%81%EC%B2%B4%EC%A0%9C/assets/%EB%B2%A0%EC%96%B4%EB%A9%94%ED%83%88%20%EB%B6%80%ED%84%B0(1)%20-%20BIOS%20%EB%B6%80%ED%8A%B8%20Boot%20Loader%EA%B9%8C%EC%A7%80/image-20231114222459509.png)
\[최신 BIOS에서의 부팅 순서 설정\]


## 왜 0x7c00 인가?
왜 우리가 작성한 코드가 처음으로 기록되는 장소가 0x0777도 아니고 0x07c0일까?

사실 이러한 값을 가질 이유는 하나도 없다!! 

대부분의 컴퓨터 공학에서의 이러한 의문스러운 값들은 역사와 관련 깊은 경우가 많고, 이번에도 같은 경우이다.

결론부터 이야기하면 초기의 상용 컴퓨터(16KiB 또는 32KiB 크기의 메모리가 사용되었던 때)가 등장했을 때의 IBM과 MS-DOS 등의 역사를 거쳐서 사실상 표준으로 0x07c0으로 정해지게 되었다.

자세한 내용은 다음을 참조하자(0x07c0과 0x7c00이 2개가 등장하는 이유는 다음 장에서)
- [Booting-Wikipedia](http://cis2.oc.ctc.edu/oc_apps/Westlund/xbook/xbook.php?unit=04&proc=page&numb=8)
- [How is the BIOS ROM mapped into address space on PC?](https://stackoverflow.com/questions/7804724/how-is-the-bios-rom-mapped-into-address-space-on-pc)
- [Why BIOS loads MBR into 0x7C00 in x86 ?](https://www.glamenv-septzen.net/en/view/6)
- [Upper memory erea](https://en.wikipedia.org/wiki/Upper_memory_area)

위 자료를 참조하면 조금 더 자세한 흐름을 이해할 수 있을 거다.

정리된 흐름은 다음과 같다.

1. CPU에 reset 신호를 전달하면 첫 실행흐름(reset vector)이 존재하는 주소를 레지스터에 저장한다.
2. 실행된 코드는 BIOS가 들어있는 ROM 주소이다
	1. 특정 주소는 ROM, 그래픽 카드, 모니터(다음 장에 코드로 알아볼 거다) 등에 맵핑되어있다
	2. 이러한 맵핑은 CPU 설계에 따른 것이다
3. BIOS는 마지막에 저장장치에 코드를 특정 영역(IBM compatible PC의 경우 0x7c00)에 복사한다

>[!info]- Intel 펜티엄의 시작코드는?
>### 6.1.2. First Instruction Executed 
>To generate an address, the base part of a segment register is added to the effective address to form the linear address. This is true for all modes of operation, although the base address is calculated differently in protected and real-address modes. To fetch an instruction, the base portion of the CS register is added to EIP to form a linear address (see Chapter 9 and Chapter 11 for details on calculating addresses).
> In real-address mode, when the value of the segment register selector is changed, the base portion will automatically be changed to this value multiplied by 16. However, immediately after reset, the base portion of the CS register behaves differently: It is not 16 times the selector value. Instead, the CS selector is 0F000H and the CS base is 0FFFF0000H. The first time the CS selector value is changed after reset, it will follow the above rule (base = selector ∗ 16). As a result, after reset, the first instruction that is being fetched and executed is at physical address: CS.base + EIP = 0FFFFFFF0H. ==This is the address to locate the EPROM with the initialization code.== This address is located 16 bytes below the uppermost address of the physical memory of the Pentium processor.
> [Pentium® Processor Family Developer's Manual](http://datasheets.chipdb.org/Intel/x86/Pentium/24143004.PDF)


## 그래서 OS는 어떻게?
그럼 OS는 어떠한 과정을 거쳐서 실행될까?

전체적인 흐름은 아래 그림과 같다
![image-20231107153309542.png](/img/user/kr/%EC%9A%B4%EC%98%81%EC%B2%B4%EC%A0%9C/assets/%EB%B2%A0%EC%96%B4%EB%A9%94%ED%83%88%20%EB%B6%80%ED%84%B0(1)%20-%20BIOS%20%EB%B6%80%ED%8A%B8%20Boot%20Loader%EA%B9%8C%EC%A7%80/image-20231107153309542.png)
\[출처 - https://en.wikipedia.org/wiki/BIOS\]

지금까지 우리가 작성하고 메모리에 적재되는 코드를 Boot Loader라고 부르고 이 Boot Loader에 OS의 중심이라고 할 수 있는 Kernel을 메모리에 적재하여 실행하는 흐름으로 진행된다!!

이러한 흐름은 OS를 USB 등에 담아서 설치하는 과정과 동일하다, USB에 적재된 Kernel을 통해서 OS를 실행시켜 OS의 USB의 OS의 코드를 다른 저장장치에 저장하는 것이다. 

우리가 컴퓨터를 살 때마다 해왔던 OS의 설치가 이러한 과정을 통해서 이루어졌던 것이다.
## 그림
전체 변화를 나타낸 그림이다.
![image-20231107143827633.png|center round|700](/img/user/kr/%EC%9A%B4%EC%98%81%EC%B2%B4%EC%A0%9C/assets/%EB%B2%A0%EC%96%B4%EB%A9%94%ED%83%88%20%EB%B6%80%ED%84%B0(1)%20-%20BIOS%20%EB%B6%80%ED%8A%B8%20Boot%20Loader%EA%B9%8C%EC%A7%80/image-20231107143827633.png)


# 숙제
1. [Floppy disk가 뭔지 알아오기](https://en.wikipedia.org/wiki/Floppy_disk)
2. 그럼 BIOS의 시작점은?
	1. [Firmware 조사하기](https://en.wikipedia.org/wiki/Firmware)
	2. [ROM 조사하기](https://en.wikipedia.org/wiki/Read-only_memory)
	3. 위 링크를 조사하고 다시 한번 글 읽기