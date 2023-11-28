---
{"dg-publish":true,"permalink":"/kr/운영체제/가상화, QEMU와 KVM코드를 중심으로 보기(QEMU 만들어 보기)/","tags":["OS/Hacker/Virtualization"],"created":"2023-11-18","updated":"2023-11-28"}
---




오픈소스 가상화 도구 중에 가장 유명한 것이 QEMU가 아닐까 싶다.
# QEMU 
QEMU는 가상화 도구 중에서도 조금 특이한 구조를 가진다, 다른 유명한 도구 중에서 VMware나 VirtualBox 는 구조를 그림으로 간단하게 설명하기 쉽지만 QEMU는 리눅스 진영의 KVM과 합쳐져서 한 그림을 나타내는 것이 쉽지 않다.

# 배경지식
## 가상화 종류
일단 배경지식으로써 어떤 가상화 기법이 존재하는지 알아보자.

### 에뮬레이터
분류상으로 에뮬레이터가 들어가는게 이상할 수 있지만, 일단 먼저 에뮬레이터부터 시작해 보자.

에뮬레이터는 다음과 같은 구조라고 생각하면 쉽다.

만약 아래와 같은 우리가 돌려야 하는 코드가 존재할 때.

```asm
mov ax, bx
add ax, 1
.
.

```
아래와 같이 동작하는 것이다.
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
\[~~이게 뭔 코드여~~\]

웬 이상한 코드가 있나 생각할 수 있지만, 아래 설명을 들어보자.

핵심은 아래와 같다, 우리가 실행하고 싶은 바이너리가 입력으로 들어왔을 때, 가상의 CPU(위 코드에서는 `struct v_cpu`)에서 바이너리에 적힌 명령에 따라서,

`add ax, 1` 일 때 v_cpu의 ax 레지스터에 1을 더해주고
`mov ax, bx` 일 때 v_cpu에 레지스터의 값을 바꿔주고

하는 식으로 가상의 CPU를 코드 상에서 동작시키는 것이다.

### 하드웨어가 지원하는 가상화
에뮬레이터는 ==당연하게도== 엄청 느리다, 위 코드에는 CPU만 존재하지만, 만약 메모리에 쓰기, 또는 하드디스크에 쓰기 같은 명령이 들어오면 가상의 메모리와 하드디스크를 위 코드처럼 작성하고 쓰기 명령을 실행해야 한다.

당연하게도 속도가 몇 배는 느려진다.

그래서 등장한 것이 *하드웨어*가 지원하는 가상화이다.

이 *하드웨어*는 당연하게도 CPU이다.

하드웨어가 지원하는 가상화는 어떻게 다를까?

다시 한번 코드를 보자, 우리가 실행하고 싶은 같은 코드가 있을 때
```asm
mov ax, bx
add ax, 1
.
.

```
CPU가 지원하는 코드는 다음과 같다.
```c
int main(){
	instruction inst[];
	
	VMXON();            // (1) Turn on Virtualization mode on CPU
	VMLAUNCH(inst);     // (2) Run Code on Real CPU
}
```

코드가 단순해졌다(~~어째 더 이해하기 어려워진 것 같다...~~).

아직 감이 오지 않는다, 조금 더 이야기를 이어 나가자.

먼저 코드 설명부터 시작하면 다음과 같다.
1. CPU의 가상화 모드를 시작하도록 한다
2. 우리가 작성한 코드가 *진짜 CPU에서* 돌아가도록 한다

여기서 중요한 것은 저 위에 ~~정체 모를~~ 코드가 아니라 *진짜 CPU에서* 우리가 작성한 코드가 돌아간다는 것이다.

조금 더 구체적으로는 Intel, AMD 등에서 지원하는 Machine Specific한 기능으로써 구현된다.

> [!info]- Machine Specific
> Intel과 AMD는 같은 아키텍처를 공유하지만, 서로 자사만의 특이한 기능을 가지고 있다. 
> 즉 놀랍게도 같은 x86 아키텍처를 쓰지만 호환이 불가능한 부분이 존재한다는 것이다.
> 가상화의 경우도 각 회사가 제공하는 명령어가 다르고, 암호화 명령어, 벡터 명령어 등에서 다른 점들이 존재한다.
> 이러한 각 자사의 CPU에서 지원하는 특이한 명령을 discontinued instruction 이라고 하고, 또한 이러한 명령어 전용으로 존재하는 레지스터 - MSR(Machine Specific Register or Model Specific Register)또한 존재한다.
> 자세한 명령 리스트는 아래 링크에 존재한다
> https://en.wikipedia.org/wiki/List_of_discontinued_x86_instructions
> https://en.wikipedia.org/wiki/X86_instruction_listings#Intel_VT-x_instructions

각 회사에서 가상화와 관련된 기능을 Intel VT-x, AMD-V 라고 부른다.

이번 포스팅에서는 Intel의 기능을 중심으로 살펴본다.


# Intel VT-x
Intel의 가상화 명령의 흐름을 조금 더 구체적으로 살펴보면 다음과 같다.

![Pasted image 20231118203801.png|center|500](/img/user/kr/%EC%9A%B4%EC%98%81%EC%B2%B4%EC%A0%9C/assets/%EA%B0%80%EC%83%81%ED%99%94,%20QEMU%EC%99%80%20KVM%EC%BD%94%EB%93%9C%EB%A5%BC%20%EC%A4%91%EC%8B%AC%EC%9C%BC%EB%A1%9C%20%EB%B3%B4%EA%B8%B0(QEMU%20%EB%A7%8C%EB%93%A4%EC%96%B4%20%EB%B3%B4%EA%B8%B0)/Pasted%20image%2020231118203801.png)
\[출처 - https://sites.cs.ucsb.edu/~rich/class/cs293b-cloud/notes/Virtualization/virtualization.html\]

만약 운영체제를 실행시킨다는 가정하에 동작하게 된다면 다음과 같이 동작한다.

1. VMXON: VM 기능을 활성화
2. VMLAUNCH: VM 기능을 시작, 게스트 OS를 실행

만약 게스트 OS에서 처리할 수 없는 이벤트, 인터럽트 등이 발생하면, VMEXIT 명령어를 발동, 호스트 OS에서 이를 처리하고 VMRESUME 명령을 통해서 게스트 OS로 복귀.

여기서 게스트 OS에서 처리할 수 없는 이벤트란 하드웨어와 관련된 이벤트 등이 포함된다.

QEMU과 KVM의 역활이 여기서 나누어지게 되는데, 이러한 *하드웨어와 관련된 영역*의 에뮬레이션을 담당하는 것이 QEMU 그리고 *CPU가 지원하는 가상화를 관리*하는 것이 KVM이다.

(위 설명이 100% 맞아떨어지는 설명은 아니다, 항상 예외는 존재한다는 것에 주의!)

# KVM
KVM은 위에서 말했듯이 CPU가 지원하는 가상화를 관리하는 일을 한다.

예를 들어서 게스트 OS에서 처리할 수 없는 일이 일어났다는 신호를 보내면, 마치 OS의 Context Switch와 동일한 과정을 통해서 요구한 일을 처리한다.

예를 들어
1. 게스트 OS에서 사용했던 레지스트와 같은 정보를 보관
2. 게스트 OS에서 요구한 이벤트에 대한 처리
	1. 구체적으로는 요구한 이벤트에 대한 이벤트 핸들러 호출
3. 처리한 이벤트에 대한 정보(e.g return 값)와 저장했던 게스트 OS의 정보를 CPU에 복원
4. 게스트 OS로 Context를 복귀 

와 같은 정말 운영체제상의 Context Switch와 비슷한 과정을 처리하는 것이 KVM의 역활이다.

어떻게 보면 KVM은 하이퍼바이저와 동일한 역활을 수행한다고 볼 수 있다.
## 하이퍼바이저
하이퍼바이저는 이름은 어려워 보이지만 여타 다른 모든 것이 그렇듯이 프로그램이라고 생각하면 된다.

하이퍼바이저는 운영체제에 가까운 프로그램이고, 운영체제가 프로세스에 대한 리소스 컨트롤를 한다면, 하이퍼바이저는 운영체제에 대한 관리를 하는 프로그램이다.
(운영체제에 대한 관리도 결국에는 하드웨어의 자원의 배분을 관리한다는 점에서 운영체제와 동일하다 볼 수 있다)

![Pasted image 20231118210130.png|center round|400](/img/user/kr/%EC%9A%B4%EC%98%81%EC%B2%B4%EC%A0%9C/assets/%EA%B0%80%EC%83%81%ED%99%94,%20QEMU%EC%99%80%20KVM%EC%BD%94%EB%93%9C%EB%A5%BC%20%EC%A4%91%EC%8B%AC%EC%9C%BC%EB%A1%9C%20%EB%B3%B4%EA%B8%B0(QEMU%20%EB%A7%8C%EB%93%A4%EC%96%B4%20%EB%B3%B4%EA%B8%B0)/Pasted%20image%2020231118210130.png)
\[출처 - https://en.wikipedia.org/wiki/Hypervisor\]

KVM이 독특한 점은 Linux 상에서 구현되어 있다는 점이다, 즉 리눅스 소스 코드 안에 KVM이 포함된다.

![Pasted image 20231118210344.png|center|400](/img/user/kr/%EC%9A%B4%EC%98%81%EC%B2%B4%EC%A0%9C/assets/%EA%B0%80%EC%83%81%ED%99%94,%20QEMU%EC%99%80%20KVM%EC%BD%94%EB%93%9C%EB%A5%BC%20%EC%A4%91%EC%8B%AC%EC%9C%BC%EB%A1%9C%20%EB%B3%B4%EA%B8%B0(QEMU%20%EB%A7%8C%EB%93%A4%EC%96%B4%20%EB%B3%B4%EA%B8%B0)/Pasted%20image%2020231118210344.png)
\[출처 - http://emal.iptime.org/noriwiki/index.php/Kernel_based_virtual_machine\]

~~그렇다 Linux는 자체로 하이퍼바이저도 될 수 있는 운영체제인 것이다!~~

## Code
앞서 언급했듯 KVM의 코드는 Linux 코드안에 존재한다.

특히 x86과 관련된 코드는 Architecture Specific한 코드 답게 arch 디렉터리에 존재한다.

https://github.com/torvalds/linux/tree/master/arch/x86/kvm

kvm 디렉터리 안에는 Intel 과 AMD가 다른 기술을 쓴다고 언급한 만큼 svm과 vmx라는 2가지 버전이 존재하는데, Intel 과 관련된 코드는 vmx 안에 들어있다.

### Context Switch
먼저 게스트 OS에서 Context Switch를 발생시키는 경우 일어나는 이벤트를 VMExit라고 한다,
예를 들어서, CPUID와 같은 명령어를 게스트 OS에서 실행할 시 VMExit가 발생한다.
>[!info]- CPUID 명령어
>CPUID 명령어는 x86의 어셈블리 중의 하나이고, 말 그대로 실행 시  CPU에 대한 정보를 얻는 명령어이다.
>예를 들어서 Intel, AMD 등의 제조사 정보, CPU가 지원하는 기능에 대한 정보 등에 대한 정보를 얻을 수 있다.

vmx에서 게스트 OS로의 Context Switch를 담당하는 곳은 아래 코드와 같다.
```c
//https://github.com/torvalds/linux/blob/master/arch/x86/kvm/vmx/vmenter.S#L69C1-L69C1
/**
 * __vmx_vcpu_run - Run a vCPU via a transition to VMX guest mode
 * @vmx:	struct vcpu_vmx *
 * @regs:	unsigned long * (to guest registers)
 * @flags:	VMX_RUN_VMRESUME:	use VMRESUME instead of VMLAUNCH
 *		VMX_RUN_SAVE_SPEC_CTRL: save guest SPEC_CTRL into vmx->spec_ctrl
 *
 * Returns:
 *	0 on VM-Exit, 1 on VM-Fail
 */
SYM_FUNC_START(__vmx_vcpu_run)
	push %_ASM_BP
	mov  %_ASM_SP, %_ASM_BP
#ifdef CONFIG_X86_64
	push %r15
	push %r14
	push %r13
	push %r12
.
.

	/* Load guest registers.  Don't clobber flags. */
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
위와 같이 운영체제의 Context Switch와 크게 다르지 않음을 알 수 있다.
### Event Handler
Event Handler는 다음과 같이 동작한다, VMExit 가 동작할 시 VMExit가 발생한 ==이유(Exit Reason)==가 레지스터에 기록되고, 기록된 Exit Reason에 따라서 Handler가 호출된다.

언급했던 것처럼 CPUID가 원인인 경우 `EXIT_REASON_CPUID`로 설정되고 `kvm_emulate_cpuid` 함수가 호출되는 형식이다.

```c
//https://github.com/torvalds/linux/blob/master/arch/x86/kvm/vmx/vmx.c#L6075
/*
 * The exit handlers return 1 if the exit was handled fully and guest execution
 * may resume.  Otherwise they set the kvm_run parameter to indicate what needs
 * to be done to userspace and return 0.
 */
static int (*kvm_vmx_exit_handlers[])(struct kvm_vcpu *vcpu) = {
	[EXIT_REASON_EXCEPTION_NMI]           = handle_exception_nmi,
	[EXIT_REASON_EXTERNAL_INTERRUPT]      = handle_external_interrupt,
	[EXIT_REASON_TRIPLE_FAULT]            = handle_triple_fault,
	[EXIT_REASON_NMI_WINDOW]	      = handle_nmi_window,
	[EXIT_REASON_IO_INSTRUCTION]          = handle_io,
	[EXIT_REASON_CR_ACCESS]               = handle_cr,
	[EXIT_REASON_DR_ACCESS]               = handle_dr,
	[EXIT_REASON_CPUID]                   = kvm_emulate_cpuid,
	[EXIT_REASON_MSR_READ]                = kvm_emulate_rdmsr,
	[EXIT_REASON_MSR_WRITE]               = kvm_emulate_wrmsr,
	[EXIT_REASON_INTERRUPT_WINDOW]        = handle_interrupt_window,
.
.
```

# QEMU 만들기
## Kernel Code
이제 커널의 KVM을 사용해서 우리가 작성한 어셈블리를 기동시켜 주는 우리만의 QEMU를 작성해 우리가 [[kr/운영체제/베어메탈 부터(2) - 나만의 작은 Boot Loader\|이전에]] 작성한 부트로더를 작동시켜 보자.

코드는 아래와 같고, 코드에서 바뀐 부분은 
1. 0x07C0으로의 jmp 삭제
2. 메지 출력이 끝난 후 hlt 명령어를 통해 종료를 알림

로 두 가지이다.

```c

; diff
;6,7d5
;< jmp 0x07C0:START
;<
;9c7
;<   mov ax, 0x07C0
;---
;>   mov ax, 0x0000
;44c42
;<   jmp $
;---
;>   hlt

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
  mov cl, byte [ si + MESSAGE1 ]

  cmp cl, 0
  je .MESSAGEEND

  mov byte [ es: di ], cl

  add si, 1
  add di, 2

  jmp .MESSAGELOOP
.MESSAGEEND:

  hlt

MESSAGE1: db "\
 _   _      _ _        __        __         _     _ _                           \
| | | | ___| | | ___   \ \      / /__  _ __| | __| | |                          \
| |_| |/ _ \ | |/ _ \   \ \ /\ / / _ \| '__| |/ _` | |                          \
|  _  |  __/ | | (_) |   \ V  V / (_) | |  | | (_| |_|                          \
|_| |_|\___|_|_|\___/     \_/\_/ \___/|_|  |_|\__,_(_)                          \
", 00

times 510 - ($ - $$) db 0x00

db 0x55
db 0xAA
```


## Pico QEMU
다음으로 우리의 Pico 사이즈 QEMU의 코드를 살펴보자.

실제 QEMU에서는 보통 다음과 같이 `ioctl` 시스템콜을 이용해서 kvm 파일(디바이스)과의 IO Control을 진행한다.

실제 vcpu를 초기화하는 코드를 살펴보면 아래 그림과 같이 초기화를 진행하는 것을 볼 수 있다.

![image-20231128183608093.png|center round|700](/img/user/kr/%EC%9A%B4%EC%98%81%EC%B2%B4%EC%A0%9C/assets/%EA%B0%80%EC%83%81%ED%99%94,%20QEMU%EC%99%80%20KVM%EC%BD%94%EB%93%9C%EB%A5%BC%20%EC%A4%91%EC%8B%AC%EC%9C%BC%EB%A1%9C%20%EB%B3%B4%EA%B8%B0(QEMU%20%EB%A7%8C%EB%93%A4%EC%96%B4%20%EB%B3%B4%EA%B8%B0)/image-20231128183608093.png)


전체 코드는 아래와 같다.

화면에 표시되는 모니터의 경우 모니터 구조체를 생성하여 구조체에 값을 적도록 하였다.

그리고 `hlt`명령이 실행되는 타이밍에 모니터 구조체에 쓰인 값을 출력하고 종료하도록 작성하였다.

또한 어떠한 값이 쓰이는 지 등이 궁금한 사람은 주석 처리된 부분을 해제하면 값을 볼 수 있을 것이다.


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
                         MAP_SHARED | MAP_ANONYMOUS, -1, 0);
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
      // ^
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
	        // Unknown exit reason occured 
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

## 코드 설명
먼저 vcpu를 kvm 디바이스에 요청하고 파일 디스크립터를 발급받는다.
```c
   /* open kvm device */
   kvm_fd = open(KVM_DEV, O_RDWR);
   assert(kvm_fd > 0);

.
.
.
   /* map 4K into memory */
   userspace_addr = mmap(NULL, PAGE_SIZE, PROT_READ | PROT_WRITE,
                         MAP_SHARED | MAP_ANONYMOUS, -1, 0);
```

다음으로 `mmap` 시스템콜을 통해서 게스트에서 사용하는 메모리를 생성할 수 있다.

또한 `userspace_addr`의 값을 아래 주석을 해제하여 살펴보면 우리가 작성한 어셈블리의 바이너리가 올려져 있을 것이다.

```c
   /* vcpu run */
   while (1) {
.
      // print_bytes(mem.userspace_addr, 512);
      // ^
      // |_ You can check your bootloader code in mem.userspace_addr
```

마지막으로 우리가 생성한 메모리의 크기가 0x1000 이기 때문에 모니터의 메모리 주소인 0xb8000에 비해서 크게 작은 것을 알 수 있다.

이러한 경우 0xb8000에 무언가를 쓰려하면 kvm내에서 처리할 수 없는 쓰기이기 때문에 kvm에서 VMEXIT을 발생시키고 exit reason은 `KVM_EXIT_MMIO` 이 된다.

이 경우 현재 쓰고 싶어 하는 주소와 값과 데이터, 데이터의 길이 등이 `mmio`에 기록되어 있기 때문에 이 값을 현재 코드에 존재하는 가상 모니터(`vga_monitor`)에 쓰면, 주소 0xb8000 에 기록되는 값이 가상 모니터에 쓰이게 된다. 
```c
         case KVM_EXIT_MMIO:
            // printf("phys addr: %llx data: %u len: %u is_write: %u\n",
            // kvm_run->mmio.phys_addr, kvm_run->mmio.data[0],
            // kvm_run->mmio.len, kvm_run->mmio.is_write);
            *((char *)(&monitor) + (int)(kvm_run->mmio.phys_addr - 0xb8000)) =
                kvm_run->mmio.data[0];
```
## 실행 결과
실행 결과는 다음과 같다.

원하는 값이 잘 표시되는 것을 확인할 수 있다.
![image-20231128184115199.png|center round|300](/img/user/kr/%EC%9A%B4%EC%98%81%EC%B2%B4%EC%A0%9C/assets/%EA%B0%80%EC%83%81%ED%99%94,%20QEMU%EC%99%80%20KVM%EC%BD%94%EB%93%9C%EB%A5%BC%20%EC%A4%91%EC%8B%AC%EC%9C%BC%EB%A1%9C%20%EB%B3%B4%EA%B8%B0(QEMU%20%EB%A7%8C%EB%93%A4%EC%96%B4%20%EB%B3%B4%EA%B8%B0)/image-20231128184115199.png)

또한 [[kr/운영체제/베어메탈 부터(2) - 나만의 작은 Boot Loader\|이전에]] 작성한 부트로드의 실행 결과와 비교해 보자.
![image-20231128184134639.png|center round|300](/img/user/kr/%EC%9A%B4%EC%98%81%EC%B2%B4%EC%A0%9C/assets/%EA%B0%80%EC%83%81%ED%99%94,%20QEMU%EC%99%80%20KVM%EC%BD%94%EB%93%9C%EB%A5%BC%20%EC%A4%91%EC%8B%AC%EC%9C%BC%EB%A1%9C%20%EB%B3%B4%EA%B8%B0(QEMU%20%EB%A7%8C%EB%93%A4%EC%96%B4%20%EB%B3%B4%EA%B8%B0)/image-20231128184134639.png)


# 부록
가상화 기술에서도 다양한 최적화 기술이 존재하고, 그중 가장 특이한 것이 페이징과 관련된 부분일 것이다.

기본적인 운영체제의 경우 한번 메모리 참조를 하기 위해서

`메모리 참조 --> 페이징 테이블 참조 --> 실제 메모리 참조`

와 같은 흐름을 거쳐야 한다, 그런데 가상화를 진행한 경우에는?

간단히 생각해도

`게스트 메모리 참조 --> 게스트 페이징 테이블 참조 --> 게스트 실제 메모리 참조(?) --> 호스트 메모리 참조 --> 호스트 페이징 테이블 참조 --> 호스트 실제 메모리 참조(?)`

흠, 아무리 생각해도 오버헤드가 너무 크다.

이러한 문제를 해결하기 위해서 하드웨어 가상화 시에 이런 페이징 테이블 참조의 최적화를 위한 기능을 지원한다.

자세한 내용은 아래를 참조

https://en.wikipedia.org/wiki/Second_Level_Address_Translation
# 참고 자료
https://shhoya.github.io/hv_intro.html
https://sites.cs.ucsb.edu/~rich/class/cs293b-cloud/notes/Virtualization/virtualization.html
https://mp.weixin.qq.com/s/jOzHdSSR4XPQPa5N5f_GCg

https://stackoverflow.com/questions/3215878/what-are-in-out-instructions-in-x86-used-for