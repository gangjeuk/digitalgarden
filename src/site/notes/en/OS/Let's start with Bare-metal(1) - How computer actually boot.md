---
tags:
  - Computer-Science
  - TODO/need_to_upload
  - OS/Basic/BareMetal1
created: 2023-11-07
글확인: true
dg-publish: true
updated: 2023-11-18
번역확인: true
cover: "[[Pasted image 20231203165134.png]]"
---


# Baremetal
Bare metal is defined as follows

>[!quote]
>In computer science, bare machine (or bare metal) refers to a computer executing instructions directly on logic hardware without an intervening operating system.

Earlier, we said that an operating system is a program that manages programs.

In other words, it is essentially a program.

The goal of this chapter is to take a simple program written in C and run it on a real CPU.

It's awkward to call it an operating system yet, but [hey, even Linus' Linux started with a terminal program!!!](https://joone.net/2018/10/22/27-%EB%A6%AC%EB%88%85%EC%8A%A4-%EC%9D%B4%EC%95%BC%EA%B8%B0-%EB%82%98%EB%A7%8C%EC%9D%98-%ED%84%B0%EB%AF%B8%EB%84%90-%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%A8/)

# Preparing the virtual environment
Let's run a simple program on the CPU.

First, we need to set up the following environment

1. QEMU
2. a program editor (VScode, Vim, Emacs, etc.)

## Installing QEMU
QEMU is a virtualization tool that allows us to use virtual computers.

It's open source and available for Windows and Linux.

On Windows, you can install it with a simple command by creating a separate WSL environment.

Let's install it using the link below

<div class="transclusion internal-embed is-loaded"><div class="markdown-embed">



### WSL2
[WSL2 설치](https://www.google.com/search?q=wsl2+install&sca_esv=575552500&ei=AMc0ZdS2Ls-hhwP79qLABw&ved=0ahUKEwjUtq2MiYmCAxXP0GEKHXu7CHgQ4dUDCBA&uact=5&oq=wsl2+install&gs_lp=Egxnd3Mtd2l6LXNlcnAiDHdzbDIgaW5zdGFsbDIFEAAYgAQyBRAAGIAEMgUQABiABDIFEAAYgAQyBRAAGIAEMgUQABiABDIFEAAYgAQyBRAAGIAEMgUQABiABDIFEAAYgARI0xFQkgZY4xBwAngBkAEBmAHCAqABgQqqAQcwLjcuMC4xuAEDyAEA-AEBwgIKEAAYRxjWBBiwA8ICBxAAGA0YgATiAwQYACBBiAYBkAYK&sclient=gws-wiz-serp)

WSL2를 설치하고 설정이 끝나면 

[[kr/C 언어/C 언어와 친해지기 전의 준비#Linux\|C 언어와 친해지기 전의 준비#Linux]]로 넘어간다.

</div></div>


Or you can download it from the [QEMU site download page](https://www.qemu.org/download/).

## Program Editor
For program editors, I won't go into detail here, but you can research the different editors and choose the one you are most comfortable using.

The following options are recommended for first-time programmers.
1. [Microsoft - VScode](https://code.visualstudio.com/)
2. [Jetbrain - CLion](https://www.jetbrains.com/ko-kr/clion/)

Once you've gotten used to these editing tools, let's take a look at the options available to you without taking your hands off the keyboard.

1. [Neovim](https://neovim.io/) (my current tool)
	1. [[kr/지식나눔/LazyVim 설치 및 설정하기\|LazyVim]] I have this plugin installed and using it
2. [Emacs](https://www.gnu.org/s/emacs/)

Actually, the editor is just a tool to make it easier for you to use, you can use whatever you want, like Notepad or [Notepad++](https://notepad-plus-plus.org/)!!!

# Hello World?
Now let's create a simple program and run it.

This is the code for a program that prints Hello World!

The code looks like this

```c
// hello.c
#include <stdio.h>
int main()
{ printf("Hello World\n")
	printf("Hello World\n");
	return 0;
}
```

But will this code work?

Of course ==*no*==.

So let's answer the "why?" question here.

So far, we've covered the history of the C language and the operating system.

From what we've learned so far, we should know that

1. the operating system provides abstractions
2. The Hello World code is using the standard library called `#include<stdio.h>`
3. our currently configured QEMU environment looks like the picture below

![image-20231106142900672.png|center round|700](/img/user/kr/%EC%9A%B4%EC%98%81%EC%B2%B4%EC%A0%9C/assets/%EB%B2%A0%EC%96%B4%EB%A9%94%ED%83%88%20%EB%B6%80%ED%84%B0(1)%20-%20BIOS%20%EB%B6%80%ED%8A%B8%20Boot%20Loader%EA%B9%8C%EC%A7%80/image-20231106142900672.png)

And our current overall configuration looks like this
![image-20231106143025350.png|center round|700](/img/user/kr/%EC%9A%B4%EC%98%81%EC%B2%B4%EC%A0%9C/assets/%EB%B2%A0%EC%96%B4%EB%A9%94%ED%83%88%20%EB%B6%80%ED%84%B0(1)%20-%20BIOS%20%EB%B6%80%ED%8A%B8%20Boot%20Loader%EA%B9%8C%EC%A7%80/image-20231106143025350.png)
On the left is the environment we are currently using and on the right is the environment configured with QEMU.

What's missing?
1. no *display*
2. no keyboard
3. no mouse
4. no *storage*!!!

What the hack!!!

How could the screen of a computer be displayed? (This is something I never thought about when I was simply using the `printf` function!)

And in what order does our code go through the CPU?

How do we **tell** QEMU to read the code we wrote in the first place?

# Toward printing "Hello World!"
Where does the computer *start*?

It's the ==BIOS==, but what is a BIOS? According to Wikipedia
> [!quote] BIOS
> In computing, BIOS (/ˈbaɪɒs, -oʊs/, BY-oss, -ohss; Basic Input/Output System, also known as the System BIOS, ROM BIOS, BIOS ROM or PC BIOS) is firmware used to provide runtime services for operating systems and programs and to perform hardware initialization during the booting process (power-on startup).
[bios](izagxjwfbzvjmjpv) - https://en.wikipedia.org/wiki/BIOS

In other words, it is ==firmware== that performs simple input/output functions, runs the OS, and initializes hardware.

Don't be alarmed if you suddenly see a new word for firmware, it's all the same program.

The key words here are *input/output functions*, *running an OS*, and *initializing hardware*.

These three keywords answer most of the questions above, so let's look at them one by one.

## Initialization of hardware (moving code)
First of all, how do you move the code you've written?

Wired? Wireless? No, your computer isn't that smart yet.

We're going to move it through the *main memory device* (just USB, Floppy Disk, HDD, SSD, etc.).

Here's what it looks like
![image-20231106160103504.png|center round|700](/img/user/kr/%EC%9A%B4%EC%98%81%EC%B2%B4%EC%A0%9C/assets/%EB%B2%A0%EC%96%B4%EB%A9%94%ED%83%88%20%EB%B6%80%ED%84%B0(1)%20-%20BIOS%20%EB%B6%80%ED%8A%B8%20Boot%20Loader%EA%B9%8C%EC%A7%80/image-20231106160103504.png)
The flow is as follows
1. first compile the code you wrote
2. save the compiled binary to a storage device (in this case, a floppy disk)
3. recognize it on your computer (like plugging in a USB)

And now it's time for the BIOS.

## BIOS
The BIOS first recognizes the hardware and checks to see what devices are plugged in where, if there is RAM memory, how much, and if the monitor, keyboard, and mouse are connected.

Let's look at the image below to understand the flow
![image-20231106161337381.png|center round|600](/img/user/kr/%EC%9A%B4%EC%98%81%EC%B2%B4%EC%A0%9C/assets/%EB%B2%A0%EC%96%B4%EB%A9%94%ED%83%88%20%EB%B6%80%ED%84%B0(1)%20-%20BIOS%20%EB%B6%80%ED%8A%B8%20Boot%20Loader%EA%B9%8C%EC%A7%80/image-20231106161337381.png)
RAM alone is not enough, so let's add some other hardware.
First, a monitor to display the screen.
![image-20231106161758316.png|center round|600](/img/user/kr/%EC%9A%B4%EC%98%81%EC%B2%B4%EC%A0%9C/assets/%EB%B2%A0%EC%96%B4%EB%A9%94%ED%83%88%20%EB%B6%80%ED%84%B0(1)%20-%20BIOS%20%EB%B6%80%ED%8A%B8%20Boot%20Loader%EA%B9%8C%EC%A7%80/image-20231106161758316.png)
And a storage device where our code resides?
![image-20231106161942699.png|center round|600](/img/user/kr/%EC%9A%B4%EC%98%81%EC%B2%B4%EC%A0%9C/assets/%EB%B2%A0%EC%96%B4%EB%A9%94%ED%83%88%20%EB%B6%80%ED%84%B0(1)%20-%20BIOS%20%EB%B6%80%ED%8A%B8%20Boot%20Loader%EA%B9%8C%EC%A7%80/image-20231106161942699.png)

Finally, we have a plausible(?) computer with the hardware found in modern computers. And we know that the BIOS recognizes the hardware we connected.

But there's still a problem.

We know that the storage holds our code, and we know that the BIOS recognizes the storage.

However, if we think about it a bit, how can we get the CPU to read this data if the BIOS doesn't even know what it contains?

The BIOS has no idea *where* or *what* data exists on it?

## Bootloader (the starting point of our code)
The answer is actually simple: The engineers made a promise.

To solve the problem presented in the previous chapter, engineers *promised* the last thing a program called the BIOS would do.

First, the BIOS will copy/paste the first sector (0x200, 512 bytes in size) that exists in [[en/OS/Let's start with Bare-metal(1) - How computer actually boot#What if there are multiple storage devices?\| selected device]] into [[en/OS/Let's start with Bare-metal(1) - How computer actually boot#Why 0x7c00?\|promised address]].

Secondly, the BIOS will jump to the given address and make the code we (or you) created work!!!

Pictorially, it looks like this
![image-20231107143135220.png|center round|700](/img/user/kr/%EC%9A%B4%EC%98%81%EC%B2%B4%EC%A0%9C/assets/%EB%B2%A0%EC%96%B4%EB%A9%94%ED%83%88%20%EB%B6%80%ED%84%B0(1)%20-%20BIOS%20%EB%B6%80%ED%8A%B8%20Boot%20Loader%EA%B9%8C%EC%A7%80/image-20231107143135220.png)
![image-20231107143202779.png|center round|700](/img/user/kr/%EC%9A%B4%EC%98%81%EC%B2%B4%EC%A0%9C/assets/%EB%B2%A0%EC%96%B4%EB%A9%94%ED%83%88%20%EB%B6%80%ED%84%B0(1)%20-%20BIOS%20%EB%B6%80%ED%8A%B8%20Boot%20Loader%EA%B9%8C%EC%A7%80/image-20231107143202779.png)
![image-20231107143801801.png|center round|700](/img/user/kr/%EC%9A%B4%EC%98%81%EC%B2%B4%EC%A0%9C/assets/%EB%B2%A0%EC%96%B4%EB%A9%94%ED%83%88%20%EB%B6%80%ED%84%B0(1)%20-%20BIOS%20%EB%B6%80%ED%8A%B8%20Boot%20Loader%EA%B9%8C%EC%A7%80/image-20231107143801801.png)
This is how code stored on a storage device such as a floppy disk, USB, or HDD is executed on the computer for the first time.

# Appendix
## What if there are multiple storage devices?
What if the device we connected is not only a floppy disk, but also a variety of devices?

Or, what if we have an HDD connected to the computer before we connect the floppy disk?

What if you want to install and run multiple OS?

The answer to this problem is that the BIOS initializes the hardware.

When the BIOS initializes the device, it already knows what devices are plugged in, so you can specify which storage device to use through the BIOS.
![image-20231114222459509.png|center round|400](/img/user/kr/%EC%9A%B4%EC%98%81%EC%B2%B4%EC%A0%9C/assets/%EB%B2%A0%EC%96%B4%EB%A9%94%ED%83%88%20%EB%B6%80%ED%84%B0(1)%20-%20BIOS%20%EB%B6%80%ED%8A%B8%20Boot%20Loader%EA%B9%8C%EC%A7%80/image-20231114222459509.png)
\[Setting the boot order in BIOS\]


## Why 0x7c00?
Why is the first place our code is written to be 0x07c0 and not 0x0777(or somewhere else)?

In fact, there is no reason to have these values at all!

Most of these questionable values in computer science have a lot to do with history.

The bottom line is that 0x07c0 has been the de facto standard since the early days of commercial computers (when 16- or 32-kilobyte memory was used), through the history of IBM and MS-DOS.

For more information, see (Why there are two other values, 0x07c0 and 0x7c00, will be discussed in the next chapter.)
- [Booting-Wikipedia](http://cis2.oc.ctc.edu/oc_apps/Westlund/xbook/xbook.php?unit=04&proc=page&numb=8)
- [How is the BIOS ROM mapped into address space on PC?](https://stackoverflow.com/questions/7804724/how-is-the-bios-rom-mapped-into-address-space-on-pc)
- [Why BIOS loads MBR into 0x7C00 in x86 ?](https://www.glamenv-septzen.net/en/view/6)
- [Upper memory erea](https://en.wikipedia.org/wiki/Upper_memory_area)

If you refer to the above, you should be able to understand the flow a little better.

To summarize, the flow is as follows

1. when the CPU receives a reset signal, it stores the address of the first execution flow (reset vector) in a register.
2. the executed code is the address of the ROM containing the BIOS code
	1. Specific addresses are mapped to ROM, graphics cards, monitors (which we'll see in code in the next chapter), etc
	2. these mappings are based on the CPU design
3. the BIOS finally copies the code to a specific area on the storage device (0x7c00 on IBM compatible PCs).

>[!info]- What is the startup code for an Intel Pentium?
>### 6.1.2. First Instruction Executed
>To generate an address, the base part of a segment register is added to the effective address to form the linear address. This is true for all modes of operation, although the base address is calculated differently in protected and real-address modes. To fetch an instruction, the base portion of the CS register is added to EIP to form a linear address (see Chapter 9 and Chapter 11 for details on calculating addresses).
>
In real-address mode, when the value of the segment register selector is changed, the base portion will automatically be changed to this value multiplied by 16. However, immediately after reset, the base portion of the CS register behaves differently: It is not 16 times the selector value. Instead, the CS selector is 0F000H and the CS base is 0FFFF0000H. The first time the CS selector value is changed after reset, it will follow the above rule (base = selector ∗ 16). As a result, after reset, the first instruction that is being fetched and executed is at physical address: CS.base + EIP = 0FFFFFFF0H. ==This is the address to locate the EPROM with the initialization code.== This address is located 16 bytes below the uppermost address of the physical memory of the Pentium processor.
> [Pentium® Processor Family Developer's Manual](http://datasheets.chipdb.org/Intel/x86/Pentium/24143004.PDF)


## So what about the OS?
So how does the OS run?

The overall flow is shown below
![image-20231107153309542.png](/img/user/kr/%EC%9A%B4%EC%98%81%EC%B2%B4%EC%A0%9C/assets/%EB%B2%A0%EC%96%B4%EB%A9%94%ED%83%88%20%EB%B6%80%ED%84%B0(1)%20-%20BIOS%20%EB%B6%80%ED%8A%B8%20Boot%20Loader%EA%B9%8C%EC%A7%80/image-20231107153309542.png)
\[Source - https://en.wikipedia.org/wiki/BIOS\]

So far, the code we have written and loaded into memory is called Boot Loader and the flow is to load the Kernel, which is the center of the OS, into memory and execute it!!!

The process is the same as installing an OS on a USB: run the OS through the kernel loaded on the USB and save the OS code from the USB to another storage device. 

This is what we've been doing every time we've bought a computer: installing the OS.
## Illustration
An illustration of the overall change.
![image-20231107143827633.png|center round|700](/img/user/kr/%EC%9A%B4%EC%98%81%EC%B2%B4%EC%A0%9C/assets/%EB%B2%A0%EC%96%B4%EB%A9%94%ED%83%88%20%EB%B6%80%ED%84%B0(1)%20-%20BIOS%20%EB%B6%80%ED%8A%B8%20Boot%20Loader%EA%B9%8C%EC%A7%80/image-20231107143827633.png)


# Homework
1. [Know what a floppy disk is](https://en.wikipedia.org/wiki/Floppy_disk)
2. Where does the BIOS start?
	1. [Investigate Firmware](https://en.wikipedia.org/wiki/Firmware)
	2. investigate the ROM (https://en.wikipedia.org/wiki/Read-only_memory)
	3. investigate the above link and read the article again
