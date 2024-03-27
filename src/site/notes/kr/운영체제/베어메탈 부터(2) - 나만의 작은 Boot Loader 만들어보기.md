---
{"dg-publish":true,"permalink":"/kr/운영체제/베어메탈 부터(2) - 나만의 작은 Boot Loader 만들어보기/","tags":["OS/Basic/Baremetal2"],"created":"2023-11-23","updated":"2024-03-24"}
---

# Boot Loader 작성
이제 Boot Loader를 직접 작성해 보자.

우리는 Intel의 x86을 기반으로 코드를 작성해야 하므로 x86의 16bit 모드(Real mode)를 기준으로 어셈블리를 작성하여야 한다.

또한 이번에 사용하는 nasm의 어셈블러에서 지원하는 기능(매크로 등)들을 사용하여 코드를 작성할 것이다.

우선 코드 작성을 위해서 알아야 하는 코드 들을 아래에 정리한다.

## Segment 레지스터

### 주소지정
Real mode는 16bit 모드이고 레지스터가 가질 수 있는 최대값이 0xFFFF 인 것을 알 수 있다.

즉, 16bit 컴퓨터에서 사용할 수 있는 메모리의 최대 크기가 64KB(65,636 bytes) 이라는 것을 의미한다.

이값은, 저번 시간에 살펴본 비디오 메모리 주소인 0xB8000 보다 훨씬 작은 것을 알 수 있다.

실제 x86의 Real Mode의 경우 세그먼트 레지스터를 이용해서 최대 20bit 까지 주소를 지정할 수 있게 디자인 되었다.

즉 최대 1MB 만큼의 메모리를 사용할 수 있게 해 두었다.

그리고 이러한 주소 지정 방식은 다음과 같이 작성된다

```c
mov byte [ es: si ], 1
```
여기서 `es`는 Extra Segment를 의미하고 `si`는 Index Register이다.

이러한 세그먼트 레지스터와 다른 레지스터를 이용해서 주소를 지정할 수 있다.

실제 계산 방법은 아래와 같다.
![Pasted image 20231129213052.png|center round|600](/img/user/kr/%EC%9A%B4%EC%98%81%EC%B2%B4%EC%A0%9C/assets/%EB%B2%A0%EC%96%B4%EB%A9%94%ED%83%88%20%EB%B6%80%ED%84%B0(2)%20-%20%EB%82%98%EB%A7%8C%EC%9D%98%20%EC%9E%91%EC%9D%80%20Boot%20Loader/Pasted%20image%2020231129213052.png)
\[출처 - https://en.wikipedia.org/wiki/X86_memory_segmentation \]

식으로 생각하면 아래와 같이 생각하면 편하다.
$$
Address = Segment\ \text{* 0x10} + \text{Offset}
$$


### Far jump - x86 JMP Instruction
위에서 보았던 세그먼트 레지스터를 이용해서 주소를 확장해 사용하는 것이 x86의 특징 중 하나이다, 그리고 이러한 특징과 깊은 연관이 있는 명령이 바로 `jmp`이다.

x86에서의 주소 지정은, 현재 주소에서의 상대 주소(relative), 절대 주소(absolute)로 나뉘어 진다.

여기서 살펴보아야 할 주소 지정 방식은 절대 주소방식 중에서도 다음과 같은 문법이다.

```c
jmp 0x07C0:START
```
이러한 문법은 x86의 16bit(real mode) 모드에서 Far jump라고 부르는 주소 지정방식이고, 코드 실행 시
Instruction Pointer 레지스터가 오른쪽의 값(`START`)으로 지정되고 코드 세그먼트 레지스터의 값이 왼쪽 값(0x07c0)으로 지정된다.
## NASM 문법
다음으로 어셈블러 전용 문법을 몇 개 살펴보고 코드 작성을 시작해 보자.
### 구문
1. \[ORG 0x0\]: 코드의 시작 지점을 0x0로 설정
2. \[BITS 16\]: 16bit 코드(Real Mode 코드)인 것을 지정

### 토큰
`$`과 `$$`는 NASM에서 특이한 의미를 가지는 토큰이다.

>[!quota]
>`$` evaluates to the assembly position at the beginning of the line containing the expression; so you can code an infinite loop using `JMP $`.
>
>`$$` evaluates to the beginning of the current section; so you can tell how far into the section you are by using `($-$$)`
>출처 - https://nasm.us/doc/nasmdoc3.html

즉 현재 자신의 주소와 현재 자신의 섹션의 위치를 의미한다.

위, 출처에서도 설명하듯이 `jmp $`의 경우 무한 루프의 의미를 가지고.

`$ - $$` 는 자신이 사용하고 있는 섹션에서 얼마나 떨어져 있는지 나타낸다.

즉 `times 510 - ($ - $$) db 0x00`라는 코드는 한 섹터에서 내가 작성한 코드의 나머지 부분을 0x00으로 채우겠다는 뜻이 된다. 
(times는 반복한다는 걸 나타낸다. 만약 0x00라는 데이터를 64개 채우고 싶은 경우 `times 64 db 0x00`로 나타낸다 )

# 코드
Boot loader 코드는 다음과 같다.

```c
;bootloader.asm
[ORG 0x0]
[BITS 16]

SECTION .text

jmp 0x07C0:START

START:
  mov ax, 0x07C0
  mov ds, ax
  mov ax, 0xB800
  mov es, ax

  mov si, 0

.SCREENCLEARLOOP:
  mov byte [ es: si ], 0

  mov byte [ es: si + 1 ], 0x0A

  add si, 2

  cmp si, 80 * 25 * 2

  jl .SCREENCLEARLOOP

  mov si, 0
  mov di, 0

.MESSAGELOOP:
  mov cl, byte [ si + MESSAGE1 ]

  cmp cl, 0
  je .MESSAGEEND

  mov byte [ es: di ], cl

  add si, 1
  add di, 2

  jmp .MESSAGELOOP
.MESSAGEEND:

  jmp $

MESSAGE1: db "\
_   _      _ _        __        __         _     _ _                            \
| | | | ___| | | ___   \ \      / /__  _ __| | __| | |                          \
| |_| |/ _ \ | |/ _ \   \ \ /\ / / _ \| '__| |/ _` | |                          \
|  _  |  __/ | | (_) |   \ V  V / (_) | |  | | (_| |_|                          \
|_| |_|\___|_|_|\___/     \_/\_/ \___/|_|  |_|\__,_(_)                          \
", 00

times 510 - ($ - $$) db 0x00

db 0x55
db 0xAA
```
# 실행

다음으로 어셈블러를 이용해서 어셈블리 언어를 바이너리로 바꾸어 보자.

```bash
nasm -o bootloader.bin bootloader.asm
```
## QEMU로 컴퓨터 만들기
그리고 QEMU로 실행하여 보자.

```bash
qemu-system-x86_64 -m 10 -fda bootloader.bin
```
QEMU는 앞서 말했듯이 가상의 컴퓨터를 만들어 주는 프로그램이다, 위 명령어의 경우

- -m 10: 10MB 메모리를 사용
- -fda: 플로핏 디스크 파일을 지정

즉, 우리가 작성한 코드(`bootloader.bin`)를 플로핏 디스크에 쓰고 그것을 컴퓨터에 넣는 과정을 대신 해주는 것이다!!


![Pasted image 20231201104620.png|center round|700](/img/user/kr/%EC%9A%B4%EC%98%81%EC%B2%B4%EC%A0%9C/assets/%EB%B2%A0%EC%96%B4%EB%A9%94%ED%83%88%20%EB%B6%80%ED%84%B0(2)%20-%20%EB%82%98%EB%A7%8C%EC%9D%98%20%EC%9E%91%EC%9D%80%20Boot%20Loader/Pasted%20image%2020231201104620.png)
\[QEMU를 이용해서 위의 그림을 대체할 수 있다.\]

실행 결과 아래와 같이 표시되는 것을 확인 가능하다.
![image-20231128184134639.png|center round|500](/img/user/kr/%EC%9A%B4%EC%98%81%EC%B2%B4%EC%A0%9C/assets/%EA%B0%80%EC%83%81%ED%99%94,%20QEMU%EC%99%80%20KVM%EC%BD%94%EB%93%9C%EB%A5%BC%20%EC%A4%91%EC%8B%AC%EC%9C%BC%EB%A1%9C%20%EB%B3%B4%EA%B8%B0(QEMU%20%EB%A7%8C%EB%93%A4%EC%96%B4%20%EB%B3%B4%EA%B8%B0)/image-20231128184134639.png)



# 같은 결과 다른 코드
이제 같은 결과를 다른 코드를 이용해서 작성해보자.

아래와 같은 코드를 실행하면 같은 결과를 볼 수 있다.

새롭게 추가된 코드로 `int` 와 `call` 등이 보인다.

도대체 어떻게 화면에 같은 문자가 표시되는 것일까?

```c
[ORG 0x7C00]
[BITS 16]

%define light_grey 0x07

START:
  call .SCREENCLEARLOOP
  call .RESETCURSOR
  mov si, MESSAGE1
  call .PRINTMESSAGE
  jmp $

;Set Cursor position
;AH=02h	BH = Page Number, DH = Row, DL = Column
.RESETCURSOR:
  mov ah, 0x02
  mov bh, 0x00
  mov dh, 0x00
  mov dl, 0x00

  int 0x10
  ret

.SCREENCLEARLOOP:
  mov si, 0
  mov al, 0

.clear:
  call .PRINTCHAR
  add si, 1
  cmp si, 80 * 25
  jl .clear

  mov si, 0
  ret
;Teletype output
;AH=0Eh	AL = Character, BH = Page Number, BL = Color (only in graphic mode)
.PRINTCHAR:
  mov ah, 0x0E
  mov bh, 0x00
  mov bl, light_grey

  int 0x10
  ret

.PRINTMESSAGE:
.nextchar:
  mov al, [si]
  inc si
  or al, al
  jz .exit_function
  call .PRINTCHAR
  jmp .nextchar

.exit_function:
  ret

MESSAGE1: db "\
_   _      _ _        __        __         _     _ _                            \
| | | | ___| | | ___   \ \      / /__  _ __| | __| | |                          \
| |_| |/ _ \ | |/ _ \   \ \ /\ / / _ \| '__| |/ _` | |                          \
|  _  |  __/ | | (_) |   \ V  V / (_) | |  | | (_| |_|                          \
|_| |_|\___|_|_|\___/     \_/\_/ \___/|_|  |_|\__,_(_)                          \
", 00

times 510 - ($ - $$) db 0

db 0x55
db 0xAA
```


# 숙제
1. x86 memory mapping 알아보기
	1. https://wiki.osdev.org/Memory_Map_(x86)
	2. https://stackoverflow.com/questions/3215878/what-are-in-out-instructions-in-x86-used-for
2. 코드 마지막에 있는 0xAA, 0x55 의미 알아보기
	1. https://en.wikipedia.org/wiki/Master_boot_record
3. 다음 시간을 위해서 인터럽트, 이벤트, 트랩 등을 5분 정도 찾아 읽어보기
