---
{"dg-publish":true,"permalink":"/en/OS/Virtualization - Review QEMU & KVM code and Make your own QEMU/","tags":["OS/Hacker/Virtualization"],"created":"2023-11-18","updated":"2023-11-28"}
---




QEMU is probably the most famous open source virtualization tool.
# QEMU
QEMU has an unusual structure among virtualization tools. 

While VMware and VirtualBox, among other famous tools, are easy to explain with a simple picture, QEMU is combined with KVM in the Linux, so it is not easy to show a picture.

# Background
## Types of Virtualization
As a background, let's take a look at what virtualization techniques exist.

### Emulators
It may seem strange to include emulators in this category, but let's start with emulators first.

An emulator can be thought of as the following structure.

If we have a piece of code that we need to run that looks like this.

```asm
mov ax, bx
add ax, 1
.
.

```
It works like this
```c
struct v_cpu{
int ax;
int bx;
.
};


int emulate(struct v_cpu cpu, struct instruction inst[]){
while(1){
	// add ax, 1
	if(inst == 'add'){
		cpu.ax + 1;
		.
	}
	.
	.
	// mov ax, bx
	if(inst == 'mov'){
		cpu.bx = cpu.ax;
		.
	}
}
}

int main(){
v_cpu cpu;
instruction inst[];
emulate(cpu, inst);
}
```
\[~~What the hack?~~\]

You might be thinking that this is some weird code, but let me explain.

The gist of it is this: when we get a binary as input that we want to execute, we execute it on a virtual CPU (`struct v_cpu` in the code above) according to the instructions written in the binary,

`add ax, 1`: Add 1 to the ax register of v_cpu for 

`mov ax, bx`: Swaps the values of the registers in v_cpu.

and so on to make the virtual CPU work in your code.

### Virtualization supported by hardware
Emulators are ==naturally== very slow, and although only the CPU is present in the code above, when commands like write to memory or write to the hard disk come in, the 'virtual' memory and hard disk must be written as above(e.g. `v_cpu`) and the write command must be executed(e.g `add, mov`).

Naturally, this will be several times slower.

This is where virtualization supported by *hardware* comes in.

This *hardware* is, of course, the CPU.

How is hardware-assisted virtualization different?

Let's look at the code again, if we have the same code that we want to run, we can use the
```asm
mov ax, bx
add ax, 1
.
.

```
The following code is supported by the CPU
```c
int main(){
instruction inst[];

VMXON(); // (1) Turn on Virtualization mode on CPU
VMLAUNCH(inst); // (2) Run Code on Real CPU
}
```

The code has been simplified (~~I feel like I'm making it harder to understand...~~).

Not quite there yet, so let's keep going.

First, let's start with the code description
1. start the CPU in virtualization mode
2. make the code we wrote run on the *real* CPU

The important thing here is that we want our code to run on the *real* CPU, not code up there.

More specifically, it's implemented as a machine-specific feature supported by Intel, AMD, etc.

> [!info]- Machine Specific
> Intel and AMD share the same architecture, but each has its own quirks.
> Surprisingly, even though they share the same x86 architecture, there are some things that are not compatible.
> In the case of virtualization, each company provides different instructions, encryption instructions, vector instructions, etc.
> These special instructions supported by each company's CPU are called discontinued instructions, and there are also registers - MSR (Machine Specific Register or Model Specific Register) - that are exclusively for these instructions.
> A detailed list of instructions can be found at the following link
> https://en.wikipedia.org/wiki/List_of_discontinued_x86_instructions
> https://en.wikipedia.org/wiki/X86_instruction_listings#Intel_VT-x_instructions

The features related to virtualization are called Intel VT-x and AMD-V by each company.

In this post, we will focus on Intel's features.


# Intel VT-x
A more specific look at the flow of virtualization commands on Intel is as follows.

![Pasted image 20231118203801.png|center|500](/img/user/kr/%EC%9A%B4%EC%98%81%EC%B2%B4%EC%A0%9C/assets/%EA%B0%80%EC%83%81%ED%99%94,%20QEMU%EC%99%80%20KVM%EC%BD%94%EB%93%9C%EB%A5%BC%20%EC%A4%91%EC%8B%AC%EC%9C%BC%EB%A1%9C%20%EB%B3%B4%EA%B8%B0(QEMU%20%EB%A7%8C%EB%93%A4%EC%96%B4%20%EB%B3%B4%EA%B8%B0)/Pasted%20image%2020231118203801.png)
\[Source - https://sites.cs.ucsb.edu/~rich/class/cs293b-cloud/notes/Virtualization/virtualization.html\]

If we assume that we want to run an operating system, it would work like this

1. VMXON: Enable VM functionality
2. VMLAUNCH: Start the VM function, running the guest OS

If an event, interrupt, etc. occurs that the guest OS cannot handle, the guest OS will issue a VMEXIT command to handle it and return to the guest OS with a VMRESUME command.

In this context, events that cannot be handled by the guest OS include hardware-related events.

This is where the roles of QEMU and KVM are divided: QEMU is responsible for emulating these *hardware-related areas* and KVM is responsible for *managing the virtualization supported by the CPU*.

(Note that this is not a 100% correct description, there are always exceptions!)

# KVM
KVM is responsible for managing the virtualization supported by the CPU, as mentioned above.

For example, if the guest OS signals that something is happening that it can't handle, it will do what it needs to do through the same process as a context switch in the OS.

For example
1. keep information such as registers used by the guest OS
2. handle the event requested by the guest OS
	1. specifically, call the event handler for the requested event
3. restore information about the processed event (e.g., the return value) and information from the guest OS that was stored to the CPU
4. return the Context to the guest OS

It's really the job of the KVM to handle a process similar to an operating system context switch.

In a way, KVM performs the same role as a hypervisor.
## Hypervisors
A hypervisor might sound difficult, but think of it as a program, just like everything else.

A hypervisor is a program that is more like an operating system.

While an operating system provides resource control for processes, a hypervisor is a program that provides management for the operating system.
(Managing the operating system is the same as the operating system in that it ultimately manages the allocation of resources on the hardware.)

![Pasted image 20231118210130.png|center round|400](/img/user/kr/%EC%9A%B4%EC%98%81%EC%B2%B4%EC%A0%9C/assets/%EA%B0%80%EC%83%81%ED%99%94,%20QEMU%EC%99%80%20KVM%EC%BD%94%EB%93%9C%EB%A5%BC%20%EC%A4%91%EC%8B%AC%EC%9C%BC%EB%A1%9C%20%EB%B3%B4%EA%B8%B0(QEMU%20%EB%A7%8C%EB%93%A4%EC%96%B4%20%EB%B3%B4%EA%B8%B0)/Pasted%20image%2020231118210130.png)
\[Source - https://en.wikipedia.org/wiki/Hypervisor\]

What makes KVM unique is that it is implemented on top of Linux, meaning that it is included in the Linux source code.

![Pasted image 20231118210344.png|center|400](/img/user/kr/%EC%9A%B4%EC%98%81%EC%B2%B4%EC%A0%9C/assets/%EA%B0%80%EC%83%81%ED%99%94,%20QEMU%EC%99%80%20KVM%EC%BD%94%EB%93%9C%EB%A5%BC%20%EC%A4%91%EC%8B%AC%EC%9C%BC%EB%A1%9C%20%EB%B3%B4%EA%B8%B0(QEMU%20%EB%A7%8C%EB%93%A4%EC%96%B4%20%EB%B3%B4%EA%B8%B0)/Pasted%20image%2020231118210344.png)
\[Source - http://emal.iptime.org/noriwiki/index.php/Kernel_based_virtual_machine\]

## Code
As mentioned earlier, the code for KVM exists inside the Linux code.

In particular, the code related to x86 is located in the arch directory as it is architecture specific.

https://github.com/torvalds/linux/tree/master/arch/x86/kvm

Inside the kvm directory, there are two versions, svm and vmx, since we mentioned that Intel and AMD use different technologies, the code related to Intel is in vmx.

### Context Switch
First, the event that occurs when the guest OS causes a Context Switch is called a VMExit,
For example, a VMExit occurs when the guest OS executes a command such as CPUID.
>[!info]- CPUID command
>The CPUID command is one of the assemblies of x86 and is literally a command to get information about the CPU when executed.
>For example, you can get information about the manufacturer (Intel, AMD, etc.), what features the CPU supports, etc.

The code below is responsible for the context switch from the vmx to the guest OS.
```c
//https://github.com/torvalds/linux/blob/master/arch/x86/kvm/vmx/vmenter.S#L69C1-L69C1
/**
* __vmx_vcpu_run - Run a vCPU via a transition to VMX guest mode
* @vmx: struct vcpu_vmx *
* @regs: unsigned long * (to guest registers)
* @flags: VMX_RUN_VMRESUME: use VMRESUME instead of VMLAUNCH
* VMX_RUN_SAVE_SPEC_CTRL: save guest SPEC_CTRL into vmx->spec_ctrl
*.
* Returns:
* 0 on VM-Exit, 1 on VM-Fail
*/
SYM_FUNC_START(__vmx_vcpu_run)
push %_ASM_BP
mov %_ASM_SP, %_ASM_BP
#ifdef CONFIG_X86_64
push %r15
push %r14
push %r13
push %r12
.
.

/* Load guest registers. Don't clobber flags. */
mov VCPU_RCX(%_ASM_AX), %_ASM_CX
mov VCPU_RDX(%_ASM_AX), %_ASM_DX
mov VCPU_RBX(%_ASM_AX), %_ASM_BX
mov VCPU_RBP(%_ASM_AX), %_ASM_BP
mov VCPU_RSI(%_ASM_AX), %_ASM_SI
mov VCPU_RDI(%_ASM_AX), %_ASM_DI

/*
* If VMRESUME/VMLAUNCH and corresponding vmexit succeed, execution resumes at
* the 'vmx_vmexit' label below.
*/
.Lvmresume:
vmresume
jmp .Lvmfail

.Lvmlaunch:
vmlaunch
jmp .Lvmfail

```
As you can see, it is not much different from the operating system's Context Switch.
### Event Handler
The Event Handler works as follows: when VMExit is executed, the ==Exit Reason== for the VMExit is written to a register, and the Handler is called according to the recorded Exit Reason.

As mentioned, if the CPUID is the cause, it is set to `EXIT_REASON_CPUID` and the `kvm_emulate_cpuid` function is called.

```c
//https://github.com/torvalds/linux/blob/master/arch/x86/kvm/vmx/vmx.c#L6075
/*
* The exit handlers return 1 if the exit was handled fully and guest execution
* may resume.  Otherwise they set the kvm_run parameter to indicate what needs
* to be done to userspace and return 0.
*/
static int (*kvm_vmx_exit_handlers[])(struct kvm_vcpu *vcpu) = {
[EXIT_REASON_EXCEPTION_NMI] = handle_exception_nmi,
[EXIT_REASON_EXTERNAL_INTERRUPT] = handle_external_interrupt,
[EXIT_REASON_TRIPLE_FAULT] = handle_triple_fault,
[EXIT_REASON_NMI_WINDOW] = handle_nmi_window,
[EXIT_REASON_IO_INSTRUCTION] = handle_io,
[EXIT_REASON_CR_ACCESS] = handle_cr,
[EXIT_REASON_DR_ACCESS] = handle_dr,
[EXIT_REASON_CPUID] = kvm_emulate_cpuid,
[EXIT_REASON_MSR_READ] = kvm_emulate_rdmsr,
[EXIT_REASON_MSR_WRITE] = kvm_emulate_wrmsr,
[EXIT_REASON_INTERRUPT_WINDOW] = handle_interrupt_window,
.
.
```

# Create QEMU
## Kernel Code
Now let's write our own QEMU that will use the kernel's KVM to launch the assembly we wrote to run the bootloader we wrote [[kr/운영체제/베어메탈 부터(2) - 나만의 작은 Boot Loader 만들어보기\|before]].

The code is shown below, with the following changes
1. delete jmp to 0x07C0
2. notify shutdown via hlt command after message output is finished


```c

; diff
;6,7d5
;< jmp 0x07C0:START
;<
;9c7
;< mov ax, 0x07C0
;--- ;> mov ax, 0x0000
;> mov ax, 0x0000
;44c42
;< jmp $
;--- ;> hlt
;> hlt

[ORG 0x0]
[BITS 16]

SECTION .text

START:
mov ax, 0x0000
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
mov cl, byte [ si + MESSAGE1 ].

cmp cl, 0
je .MESSAGEEND

mov byte [ es: di ], cl

add si, 1
add di, 2

jmp .MESSAGELOOP
.MESSAGEEND:

hlt

MESSAGE1: db "\
_ _ _ _ _ __ __ _ _ _ \
| | | | | ___| | | ___ \ \ / /__ _ __| | __| | | \
| |_| |/ _ \ | |/ _ \ \ \ /\ / / _ \| '__| |/ _` | | \
| _ | __/ | | (_) | \ v v / (_) | | | | (_| |_| \
|_| |_|\___|_|_|\___/ \_/\_/ \___/|_| |_|\__,_(_) \
", 00

times 510 - ($ - $$) db 0x00

db 0x55
db 0xAA
```


## Pico QEMU
Next, let's look at the code for our Pico-sized QEMU.

In a real QEMU, we usually use the `ioctl` system call to control the IO to and from the kvm file (device).

If you look at the code to initialize the actual VCPU, you can see the initialization process as shown below.

![image-20231128183608093.png|center round|700](/img/user/kr/%EC%9A%B4%EC%98%81%EC%B2%B4%EC%A0%9C/assets/%EA%B0%80%EC%83%81%ED%99%94,%20QEMU%EC%99%80%20KVM%EC%BD%94%EB%93%9C%EB%A5%BC%20%EC%A4%91%EC%8B%AC%EC%9C%BC%EB%A1%9C%20%EB%B3%B4%EA%B8%B0(QEMU%20%EB%A7%8C%EB%93%A4%EC%96%B4%20%EB%B3%B4%EA%B8%B0)/image-20231128183608093.png)


The full code is shown below.

For the monitor displayed on the screen, we created a monitor structure and wrote the value to the structure.

Then, when the `hlt` command is executed, it outputs the value written to the monitor structure and exits.

Also, if you are curious about what values are used, you can uncomment the code to see the values.


```c
#include <assert.h>
#include <fcntl.h>
#include <linux/kvm.h>
#include <stdio.h>
#include <string.h>
#include <sys/ioctl.h>
#include <sys/mman.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <unistd.h>

#define KVM_DEV "/dev/kvm"
#define PAGE_SIZE 0x1000

struct pixel {
char letter;
char color;
};

struct vga_monitor {
struct pixel pixel[80 * 25];
};

void print_bytes(void *ptr, size_t size) {
// char *buf = (char*) ptr;
unsigned char *p = ptr;
char cache[16];
for (size_t i = 0; i < size; i++) {
  if (i % 16 == 0) {
	 for (size_t j = 0; j < 16; j++) printf("%c", cache[i]);
	 printf("\n");
  }
  printf("0x%02hhX ", p[i]);
  cache[i % 16] = p[i];
}
}

void print_monitor(struct vga_monitor *monitor) {
for (size_t i = 0; i < 80 * 20; i++) {
  if (i % 80 == 0) printf("\n");

  printf("%c", monitor->pixel[i].letter);
}
printf("\n");
}

int main(int argc, char *argv[]) {
int kvm_fd;
int vm_fd;
int vcpu_fd;
int tiny_kernel_fd;
int ret;
int mmap_size;
char *kernel_file;

struct kvm_sregs sregs;
struct kvm_regs regs;
struct kvm_userspace_memory_region mem;
struct kvm_run *kvm_run;
struct vga_monitor monitor;
void *userspace_addr;

assert(argc == 2);
kernel_file = argv[1];

/* open kvm device */
kvm_fd = open(KVM_DEV, O_RDWR);
assert(kvm_fd > 0);

/* create VM */
vm_fd = ioctl(kvm_fd, KVM_CREATE_VM, 0);
assert(vm_fd >= 0);

/* create VCPU */
vcpu_fd = ioctl(vm_fd, KVM_CREATE_VCPU, 0);
assert(vcpu_fd >= 0);

/* open tiny_kernel binary file */
tiny_kernel_fd = open(kernel_file, O_RDONLY);
assert(tiny_kernel_fd > 0);
/* map 4K into memory */
userspace_addr = mmap(NULL, PAGE_SIZE, PROT_READ | PROT_WRITE,
					 map_shared | map_anonymous, -1, 0);
assert(userspace_addr > 0);
/* read tiny_kernel binary into the memory */
ret = read(tiny_kernel_fd, userspace_addr, PAGE_SIZE);
assert(ret >= 0);

/* set user memory region */
mem.slot = 0;
mem.flags = 0;
mem.guest_phys_addr = 0;
mem.memory_size = PAGE_SIZE;
mem.userspace_addr = (unsigned long)userspace_addr;
ret = ioctl(vm_fd, KVM_SET_USER_MEMORY_REGION, &mem);
assert(ret >= 0);

/* get kvm_run */
mmap_size = ioctl(kvm_fd, KVM_GET_VCPU_MMAP_SIZE, NULL);
assert(mmap_size >= 0);
kvm_run = (struct kvm_run *)mmap(NULL, mmap_size, PROT_READ | PROT_WRITE,
								MAP_SHARED, vcpu_fd, 0);
assert(kvm_run >= 0);

ret = ioctl(vcpu_fd, KVM_GET_SREGS, &sregs);
assert(ret >= 0);

/* set cpu registers */
#define CODE_START 0x0000
sregs.cs.selector = CODE_START;
sregs.cs.base = CODE_START * 16;
sregs.ss.selector = CODE_START;
sregs.ss.base = CODE_START * 16;
sregs.ds.selector = CODE_START;
sregs.ds.base = CODE_START * 16;
sregs.es.selector = CODE_START;
sregs.es.base = CODE_START * 16;
sregs.fs.selector = CODE_START;
sregs.fs.base = CODE_START * 16;
sregs.gs.selector = CODE_START;
sregs.cs.base = 0;
sregs.cs.selector = 0;
ret = ioctl(vcpu_fd, KVM_SET_SREGS, &sregs);
memset(&regs, 0, sizeof(struct kvm_regs));

/* set cpu */
regs.rflags = 2;
regs.rip = 0;
ret = ioctl(vcpu_fd, KVM_SET_REGS, &regs);
assert(ret >= 0);

/* vcpu run */
while (1) {
  ret = ioctl(vcpu_fd, KVM_RUN, NULL);
  assert(ret >= 0);

  // print_bytes(mem.userspace_addr, 512);
  // ^]
  // |_ You can check your bootloader code in mem.userspace_addr
  switch (kvm_run->exit_reason) {
	 case KVM_EXIT_HLT:
		printf("----KVM EXIT HLT----\n");
		print_monitor(&monitor);
		close(kvm_fd);
		close(tiny_kernel_fd);
		return 0;
	 case KVM_EXIT_MMIO:
		// printf("phys addr: %llx data: %u len: %u is_write: %u\n",
		// kvm_run->mmio.phys_addr, kvm_run->mmio.data[0],
		// kvm_run->mmio.len, kvm_run->mmio.is_write);
		*((char *)(&monitor) + (int)(kvm_run->mmio.phys_addr - 0xb8000)) =
			kvm_run->mmio.data[0];
		break;
	 default:
		// Unknown exit reason encountered
		// For debugging
		printf("Unknown exit reason: %d\n", kvm_run->exit_reason);
		ret = ioctl(vcpu_fd, KVM_GET_REGS, &regs);
		printf("rip: %lld\n", regs.rip);
		break;
  }
}

return 0;
}
```

## Code Description
First, request a VCPU from the KVM device and get a file descriptor.
```c
/* open kvm device */
kvm_fd = open(KVM_DEV, O_RDWR);
assert(kvm_fd > 0);

.
.
.
/* map 4K into memory */
userspace_addr = mmap(NULL, PAGE_SIZE, PROT_READ | PROT_WRITE,
					 map_shared | map_anonymous, -1, 0);
```

Next, we can create the memory used by the guest via the `mmap` system call.

Also, if you uncomment the value of `userspace_addr` below, you will see that the binary of the assembly we wrote is up.

```c
/* vcpu run */
while (1) {
.
  // print_bytes(mem.userspace_addr, 512);
  // ^
  // |_ You can check your bootloader code in mem.userspace_addr
```

Finally, we can see that the size of the memory we created is 0x1000, which is significantly smaller than the monitor's memory address of 0xb8000.

In this case, if you try to write something to 0xb8000, kvm will issue a VMEXIT and the exit reason will be `KVM_EXIT_MMIO` because it is a write operation that cannot be handled within kvm.

In this case, the address, value, data, and length of the data are written to `mmio`, so if you write this value to the virtual monitor (`vga_monitor`) that exists in the current code, the value written to address 0xb8000 will be written to the virtual monitor.
```c
	 case KVM_EXIT_MMIO:
		// printf("phys addr: %llx data: %u len: %u is_write: %u\n",
		// kvm_run->mmio.phys_addr, kvm_run->mmio.data[0],
		// kvm_run->mmio.len, kvm_run->mmio.is_write);
		*((char *)(&monitor) + (int)(kvm_run->mmio.phys_addr - 0xb8000)) =
			kvm_run->mmio.data[0];
```
## Execution result
The execution result is as follows

You can see that the desired value is displayed well.
![image-20231128184115199.png|center round|300](/img/user/kr/%EC%9A%B4%EC%98%81%EC%B2%B4%EC%A0%9C/assets/%EA%B0%80%EC%83%81%ED%99%94,%20QEMU%EC%99%80%20KVM%EC%BD%94%EB%93%9C%EB%A5%BC%20%EC%A4%91%EC%8B%AC%EC%9C%BC%EB%A1%9C%20%EB%B3%B4%EA%B8%B0(QEMU%20%EB%A7%8C%EB%93%A4%EC%96%B4%20%EB%B3%B4%EA%B8%B0)/image-20231128184115199.png)

And Let's compare this to the result of running the bootload we created [[kr/운영체제/베어메탈 부터(2) - 나만의 작은 Boot Loader 만들어보기\|before]]. 
![image-20231128184134639.png|center round|300](/img/user/kr/%EC%9A%B4%EC%98%81%EC%B2%B4%EC%A0%9C/assets/%EA%B0%80%EC%83%81%ED%99%94,%20QEMU%EC%99%80%20KVM%EC%BD%94%EB%93%9C%EB%A5%BC%20%EC%A4%91%EC%8B%AC%EC%9C%BC%EB%A1%9C%20%EB%B3%B4%EA%B8%B0(QEMU%20%EB%A7%8C%EB%93%A4%EC%96%B4%20%EB%B3%B4%EA%B8%B0)/image-20231128184134639.png)


# Appendix
There are many different optimization techniques in virtualization technology, and perhaps the most unique feature is related to paging.

In a basic operating system, a single memory reference is made to the

memory reference --> paging table reference --> physical memory reference

for a single memory reference, but what about virtualization?

Simply put

guest memory reference --> guest paging table reference --> guest physical memory reference(?) --> host memory reference --> host paging table reference --> host physical memory reference(?)`.

Hmm🤔, that's too much overhead, no matter how you slice it.

To solve this problem, support for optimizing these paging table-reference during hardware virtualization is exist.

See below for details

https://en.wikipedia.org/wiki/Second_Level_Address_Translation
# References
https://shhoya.github.io/hv_intro.html
https://sites.cs.ucsb.edu/~rich/class/cs293b-cloud/notes/Virtualization/virtualization.html
https://mp.weixin.qq.com/s/jOzHdSSR4XPQPa5N5f_GCg

https://stackoverflow.com/questions/3215878/what-are-in-out-instructions-in-x86-used-for