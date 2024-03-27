---
{"dg-publish":true,"permalink":"/en/OS/Let's start with Bare-metal(2) - Write your own Bootloader/","tags":["OS/Basic/Baremetal2","TODO/translate"],"created":"2023-11-23","updated":"2024-03-26"}
---

# Write the Boot Loader
Now let's write our own Boot Loader.

Since we are writing code based on Intel's x86, we need to write the assembly based on the x86's 16-bit mode (Real mode).

We will also use the features (macros, etc.) supported by NASM's assembler that we will be using to write our code.

First, let's summarize the code that you need to know to write the code below.

## Segment register

### Addressing
You can see that Real mode is 16-bit mode and the maximum value a register can have is 0xFFFF.

This means that the maximum size of memory available on a 16-bit computer is 64 KB (65,636 bytes).

Notice that this value is much smaller than the video memory address we saw last time, 0xB8000.

The actual, x86's Real Mode is designed to address up to 20 bits using segment registers.

This means that we can use up to 1MB of memory.

And this addressing scheme is written as follows

```c
mov byte [ es: si ], 1
```

where `es` is the Extra Segment and `si` is the Index Register.

These segment registers and other registers can be used to specify addresses.

The actual calculation is as follows
![Pasted image 20231129213052.png|center round|600](/img/user/kr/%EC%9A%B4%EC%98%81%EC%B2%B4%EC%A0%9C/assets/%EB%B2%A0%EC%96%B4%EB%A9%94%ED%83%88%20%EB%B6%80%ED%84%B0(2)%20-%20%EB%82%98%EB%A7%8C%EC%9D%98%20%EC%9E%91%EC%9D%80%20Boot%20Loader/Pasted%20image%2020231129213052.png)
\[Source - https://en.wikipedia.org/wiki/X86_memory_segmentation \]

It's easier to think of it as an expression like this
$$
Address = Segment\ \text{* 0x10} + \text{Offset}
$$


### Far jump - x86 JMP Instruction
One of the features of the x86 is the ability to extend addresses using the segment registers we saw above, and the instruction closely related to this feature is the `jmp` instruction.

Addressing in x86 is divided into two types: relative to the current address and absolute.

The absolute addressing is the one we'll be looking at here, with the following syntax

```c
jmp 0x07C0:START
```
This is an addressing scheme called a far jump in x86's 16-bit (real mode) mode, which means that when the code is executed, the
The Instruction Pointer register is assigned the value on the right (`START`) and the value in the code segment register is assigned the value on the left (0x07c0).
## NASM Syntax
Next, let's look at some assembler-specific syntax and start writing code.
### Syntax
1. \[ORG 0x0\]: Set the starting point of the code to 0x0
2. \[BITS 16\]: Specifies that it is a 16-bit code (Real Mode code)

### Tokens
The `$` and `$$` are tokens with unusual meanings in NASM.

>[!quota]
>`$` evaluates to the assembly position at the beginning of the line containing the expression; so you can code an infinite loop using `JMP $`.
>
>`$$` evaluates to the beginning of the current section; so you can tell how far into the section you are by using `($-$$)`
>Source - https://nasm.us/doc/nasmdoc3.html

This means your current address and the location of your current section.

As explained above, also in the source, `jmp $` has the meaning of an infinite loop.

The `$ - $$` indicates how far away you are from the section you are in.

So the code `times 510 - ($ - $$) db 0x00` means that I'm going to fill the rest of the code I wrote in one sector with 0x00.
(The `times` indicates iteration, so if you want to fill 64 pieces of data with 0x00, you would write `times 64 db 0x00`.)

# Code
The boot loader code looks like this

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
# Execute

Next, let's turn the assembly language into binary using the assembler.

```bash
nasm -o bootloader.bin bootloader.asm
```
## Create a computer with QEMU
And let's run it with QEMU.

```bash
qemu-system-x86_64 -m 10 -fda bootloader.bin
```
QEMU is a program that creates virtual computers, as mentioned above, in the case of the above command means

-m 10: Use 10 MB of memory
-fda: specify a floppy disk file

In other words, it writes the code we wrote (`bootloader.bin`) to a floppy disk and puts it in the computer for us!!!


![Pasted image 20231201104620.png|center round|700](/img/user/kr/%EC%9A%B4%EC%98%81%EC%B2%B4%EC%A0%9C/assets/%EB%B2%A0%EC%96%B4%EB%A9%94%ED%83%88%20%EB%B6%80%ED%84%B0(2)%20-%20%EB%82%98%EB%A7%8C%EC%9D%98%20%EC%9E%91%EC%9D%80%20Boot%20Loader/Pasted%20image%2020231201104620.png)
\[QEMU can be used to replace the process on figure above.\]

After executing the command, you can see the result like below.
![image-20231128184134639.png|center round|500](/img/user/kr/%EC%9A%B4%EC%98%81%EC%B2%B4%EC%A0%9C/assets/%EA%B0%80%EC%83%81%ED%99%94,%20QEMU%EC%99%80%20KVM%EC%BD%94%EB%93%9C%EB%A5%BC%20%EC%A4%91%EC%8B%AC%EC%9C%BC%EB%A1%9C%20%EB%B3%B4%EA%B8%B0(QEMU%20%EB%A7%8C%EB%93%A4%EC%96%B4%20%EB%B3%B4%EA%B8%B0)/image-20231128184134639.png)



# Same result, different code
Now, let's create the same result using different code.

If you run the code below, you'll see the same result.

You may notice the new instructions had been added: `int` and `call`.

How on earth do we see the same characters on the screen?

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


# Homework
1. Learn x86 memory mapping
	1. https://wiki.osdev.org/Memory_Map_(x86)
	2. https://stackoverflow.com/questions/3215878/what-are-in-out-instructions-in-x86-used-for
2. learn the meaning of 0xAA, 0x55 at the end of the code
	1. https://en.wikipedia.org/wiki/Master_boot_record
3. Do 5 minutes googling and read about 'interrupts, events, traps'. for next time
