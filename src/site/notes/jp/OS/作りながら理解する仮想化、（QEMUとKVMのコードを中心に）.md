---
{"dg-publish":true,"permalink":"/jp/OS/作りながら理解する仮想化、（QEMUとKVMのコードを中心に）/","tags":["OS/Hacker/Virtualization","TODO/페이지링크수정필요"],"created":"2023-11-18","updated":"2023-11-28"}
---




オープンソースの仮想化ツールの中で最も有名なQEMUを中心に仮想化について勉強してみよう。
# QEMU
QEMUは仮想化ツールの中でも少し変わった構造を持つ。

他の有名なツールの中でVMwareやVirtualBoxはその構造を図で簡単に説明しやすいが、QEMUはLinux陣営のKVMと合体して一つの絵を表すのが難しい。

# 背景知識
## 仮想化の種類
まず背景知識として、どのような仮想化技法が存在するのか見てみましょう。

### エミュレータ
分類上、エミュレータが入るのがおかしいかもしれませんが、まずはエミュレータから始めましょう。

エミュレータは次のような構造だと考えると簡単です。

もし下記のような私たちが作成sたコードがある時。

```asm
mov ax, bx
add ax, 1
.
.

``` 

下記のように動作するのです。

```c
struct v_cpu{
	int ax；
	int bx；
	.
}；


int emulate(struct v_cpu cpu, struct instruction inst[]){。
	while(1){
		// add ax, 1
		if(inst == 'add'){
			cpu.ax + 1；
			.
		}
		.
		.
		// mov ax, bx
		if(inst == 'mov'){
			cpu.bx = cpu.ax；
			.
		}
	}
} }

int main(){
	v_cpu cpu；
	命令 inst[]；
	emulate(cpu, inst)；
}
```

\[~~これは何のコードだ～～\] 

なんか変なコードがあるかと思うかもしれませんが、下記の説明を聞いてみましょう。

要は以下のように、私たちが実行したいバイナリが入力されると、仮想のCPU(上のコードでは `struct v_cpu`)でバイナリに書かれたコマンドに従って実行する、

add ax, 1` の時に v_cpu の ax レジスタに 1 を加算し
mov ax, bx` のとき v_cpu のレジスタの値を変更します。

上のように、仮想のCPUをコード上で動作させるのである。

### ハードウェアがサポートする仮想化
エミュレータは==当然のことながら==非常に遅い、上記のコードにはCPUしか存在しないが、もしメモリへの書き込み、またはハードディスクへの書き込みのような命令の場合、仮想のメモリとハードディスクを上記のコードのように作成し、書き込み命令を実行しなければならない。

当然のことながら速度は何倍も遅くなる。

そこで登場したのが、*ハードウェア*がサポートする仮想化である。

この*ハードウェア*は当然のことながらCPUである。

ハードウェアがサポートする仮想化はどう違うのか？

もう一度コードを見てみましょう、私たちが実行したい同じコードがあるとき
```asm
mov ax, bx
add ax, 1
.
.
```

CPU がサポートするコードは以下の通りです。
```c
int main(){
	instruction inst[]；
	
	VMXON(); // (1) Turn on Virtualization mode on CPU
	VMLAUNCH(inst); // (2) Run Code on Real CPU
}
```

コードがシンプルになりました(~~なんだかもっと分かりにくくなったような...~~).

まだよくわからない、もう少し話を進めていきましょう。

まず、コードの説明から始めると次のようになります。
1.CPUの仮想化モードを起動する
2.私たちが書いたコードが*本当のCPUで*動くようにする

ここで重要なことは、上の~~正体不明な~~コードではなく、*本当のCPU上で*私たちが作ったコードが動くということです。

もう少し具体的にはIntel, AMDなどでサポートするMachine Specificな機能として実装されます。

> [!info]- Machine Specific
> IntelとAMDは同じアーキテクチャを共有していますが、お互いに独自の特異な機能を持っています。
> つまり、驚くべきことに、同じx86アーキテクチャを使うが、互換性のない部分が存在する。
> 仮想化の場合も、各社が提供する命令が異なり、暗号化命令、ベクトル命令などで異なる点が存在する。
> このような各社のCPUでサポートする特異な命令をdiscontinued instructionといい、また、このような命令専用に存在するレジスタ - MSR(Machine Specific Register or Model Specific Register)も存在する。
> 詳細な命令リストは下記のリンクに存在します。
> https://en.wikipedia.org/wiki/List_of_discontinued_x86_instructions
> https://en.wikipedia.org/wiki/X86_instruction_listings#Intel_VT-x_instructions

各社で仮想化に関連する機能を Intel VT-x, AMD-V と呼んでいる。

今回の記事ではIntelの機能を中心に説明します。


# Intel VT-x
Intelの仮想化コマンドの流れを少し具体的に説明すると、次のようになります。

![Pasted image 20231118203801.png|center|500](/img/user/kr/%EC%9A%B4%EC%98%81%EC%B2%B4%EC%A0%9C/assets/%EA%B0%80%EC%83%81%ED%99%94,%20QEMU%EC%99%80%20KVM%EC%BD%94%EB%93%9C%EB%A5%BC%20%EC%A4%91%EC%8B%AC%EC%9C%BC%EB%A1%9C%20%EB%B3%B4%EA%B8%B0(QEMU%20%EB%A7%8C%EB%93%A4%EC%96%B4%20%EB%B3%B4%EA%B8%B0)/Pasted%20image%2020231118203801.png)
\[Reference - https://sites.cs.ucsb.edu/~rich/class/cs293b-cloud/notes/Virtualization/virtualization.html\]]

もし、オペレーティングシステムを実行させるという前提で動作すると次のように動作します。

1. VMXON: VM機能を有効にします。
2. VMLAUNCH: VM機能を起動し、ゲストOSを実行します。

もしゲストOSで処理できないイベント、割り込みなどが発生すると、VMEXITコマンドを発動、ホストOSでこれを処理し、VMRESUMEコマンドでゲストOSに復帰。

ここで、ゲストOSで処理できないイベントとは、ハードウェアに関連するイベントなどが含まれる。

ここでQEMUとKVMの役割が分かれますが、このような*ハードウェアに関連する領域*のエミュレーションを担当するのがQEMU、そして*CPUがサポートする仮想化を管理*するのがKVMです。

(上記の説明は100%当てはまるわけではなく、常に例外は存在することに注意してください!)

# KVM
KVMは上記のように、CPUがサポートする仮想化を管理します。

例えば、ゲストOSが処理できないことが起こったという信号を送ると、OSのコンテキストスイッチと同じように、要求されたことを処理します。

例えば
1.ゲストOSで使用したレジストなどの情報を保管する。
2.ゲストOSから要求されたイベントに対する処理
	1.具体的には、要求したイベントに対するイベントハンドラを呼び出す。
3.処理したイベントに関する情報(e.g return値)と保存したゲストOSの情報をCPUに復元する
4.ゲストOSにContextを戻す

など、本当にOS上のContext Switchに近い処理を行うのがKVMの役割です。

ある意味、KVMはハイパーバイザーと同じ役割をしていると言えます。
## ハイパーバイザー
ハイパーバイザーは名前は難しく見えますが、他のすべてのものと同じようにプログラムの一種類だと考えてください。

ハイパーバイザーはオペレーティングシステムに近いプログラムで、オペレーティングシステムがプロセスに対するリソースコントロールをするのであれば、ハイパーバイザーはオペレーティングシステムに対する管理をするプログラムです。
(オペレーティングシステムに対する管理も結局はハードウェアの資源の配分を管理するという点で、オペレーティングシステムと同じと言えます)

![Pasted image 20231118210130.png|center round|400](/img/user/kr/%EC%9A%B4%EC%98%81%EC%B2%B4%EC%A0%9C/assets/%EA%B0%80%EC%83%81%ED%99%94,%20QEMU%EC%99%80%20KVM%EC%BD%94%EB%93%9C%EB%A5%BC%20%EC%A4%91%EC%8B%AC%EC%9C%BC%EB%A1%9C%20%EB%B3%B4%EA%B8%B0(QEMU%20%EB%A7%8C%EB%93%A4%EC%96%B4%20%EB%B3%B4%EA%B8%B0)/Pasted%20image%2020231118210130.png)
\[出典 - https://en.wikipedia.org/wiki/Hypervisor\ \]

KVMがユニークな点は、Linux上で実装されているという点、つまり、Linuxのソースコードの中にKVMが含まれる。

![Pasted image 20231118210344.png|center|400](/img/user/kr/%EC%9A%B4%EC%98%81%EC%B2%B4%EC%A0%9C/assets/%EA%B0%80%EC%83%81%ED%99%94,%20QEMU%EC%99%80%20KVM%EC%BD%94%EB%93%9C%EB%A5%BC%20%EC%A4%91%EC%8B%AC%EC%9C%BC%EB%A1%9C%20%EB%B3%B4%EA%B8%B0(QEMU%20%EB%A7%8C%EB%93%A4%EC%96%B4%20%EB%B3%B4%EA%B8%B0)/Pasted%20image%2020231118210344.png)
\[出典 - http://emal.iptime.org/noriwiki/index.php/Kernel_based_virtual_machine\ \]

~~そう、Linuxはそれ自体でハイパーバイザーにもなることができるオペレーティングシステムなのです!

## Code
前述したようにKVMのコードはLinuxのコードの中に存在します。

特にx86に関連するコードはArchitecture Specificなコードらしくarchディレクトリに存在します。

https://github.com/torvalds/linux/tree/master/arch/x86/kvm

kvmディレクトリ内にはIntelとAMDが違う技術を使ってるのでsvmとvmxという2つのバージョンが存在しますが、Intel関連のコードはvmxの中に入っています。

### Context Switch
まず、ゲストOSでContext Switchを発生させる場合に起こるイベントをVMExitと呼びます、
例えば、CPUIDのようなコマンドをゲストOSで実行するとVMExitが発生します。
>[!info]- CPUIDコマンド
>CPUIDコマンドはx86のアセンブリの一つで、文字通り実行時にCPUに関する情報を取得するコマンドです。
>例えば、Intel, AMDなどのメーカー情報、CPUがサポートする機能に関する情報などの情報を得ることができます。

vmxからゲストOSへのContext Switchを担当するのは以下のコードです。

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

上のようにオペレーティングシステムのContext Switchと大きく変わらないことが分かります。
### Event Handler
Event Handlerは次のように動作し、VMExit が動作する時、VMExit が発生した ==理由(Exit Reason)==がレジスタに記録され、記録されたExit ReasonによってHandlerが呼び出されます。

前述したように、CPUIDが原因の場合は `EXIT_REASON_CPUID` が設定され、 `kvm_emulate_cpuid` 関数が呼び出される形式です。

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
# QEMU の作成
## Kernel Code
次はカーネルのKVMを使って私たちが作ったアセンブリを起動させてくれる私たちだけのQEMUを作成して私たちが[[kr/운영체제/베어메탈 부터(2) - 나만의 작은 Boot Loader 만들어보기\|以前に]]作ったブートローダを動作させてみましょう。作成したブートローダを動作させてみましょう。

コードは下記の通りで、コードで変わった部分は次の通りです。
1. 0x07C0へのjmpを削除
2. メッセージ出力が終わった後、hltコマンドで終了を通知する。

の2つです。

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
次は私たちのPicoサイズのQEMUのコードを見てみましょう。

実際のQEMUでは通常、次のように `ioctl` システムコールを使って kvmファイル(デバイス)とのIO制御を行います。

実際のvcpuを初期化するコードを見ると、下の図のように初期化を進めることを確認できます。

![image-20231128183608093.png|center round|700](/img/user/kr/%EC%9A%B4%EC%98%81%EC%B2%B4%EC%A0%9C/assets/%EA%B0%80%EC%83%81%ED%99%94,%20QEMU%EC%99%80%20KVM%EC%BD%94%EB%93%9C%EB%A5%BC%20%EC%A4%91%EC%8B%AC%EC%9C%BC%EB%A1%9C%20%EB%B3%B4%EA%B8%B0(QEMU%20%EB%A7%8C%EB%93%A4%EC%96%B4%20%EB%B3%B4%EA%B8%B0)/image-20231128183608093.png)


全体のコードは下記のようになります。

画面に表示されるモニターの場合、モニター構造体を生成して構造体に値を書き込むようにしました。

そして、`hlt`コマンドが実行されるタイミングでモニター構造体に書かれた値を出力して終了するようにしました。

また、どのような値が使われているのかなど気になる人は、コメントアウトを解除すれば値を見ることができるようにしました。


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
## コード説明
まず、vcpuをkvmデバイスに要求してファイルディスクリプタを発行します。
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
次に `mmap` システムコールを通してゲストが使用するメモリを作成することができます。

また、`userspace_addr`の値を以下の注釈を外して見てみると、私たちが作成したアセンブリのバイナリがアップロードされているはずです。

```c
   /* vcpu run */
   while (1) {
.
      // print_bytes(mem.userspace_addr, 512);
      // ^
      // |_ You can check your bootloader code in mem.userspace_addr
```


最後に私たちが生成したメモリのサイズが0x1000なので、モニターのメモリアドレスである0xb8000に比べて小さいことが分かります。

このような場合、0xb8000に何かを書こうとすると、kvm内で処理できない書き込み動作であるため、kvmはVMEXITを発生させ、exit reasonは `KVM_EXIT_MMIO` となります。

この場合、現在書きたいアドレスと値やデータ、データの長さなどが `mmio` に記録されているので、この値を現在のコードに存在する仮想モニタ(`vga_monitor`)に書き込むと、アドレス 0xb8000 に書き込まれる値が仮想モニタに書き込まれる。
```c
         case KVM_EXIT_MMIO:
            // printf("phys addr: %llx data: %u len: %u is_write: %u\n",
            // kvm_run->mmio.phys_addr, kvm_run->mmio.data[0],
            // kvm_run->mmio.len, kvm_run->mmio.is_write);
            *((char *)(&monitor) + (int)(kvm_run->mmio.phys_addr - 0xb8000)) =
                kvm_run->mmio.data[0];
```
## 実行結果
実行結果は次のようになります。

値がうまく表示されることが確認できます。
![image-20231128184115199.png|center round|300](/img/user/kr/%EC%9A%B4%EC%98%81%EC%B2%B4%EC%A0%9C/assets/%EA%B0%80%EC%83%81%ED%99%94,%20QEMU%EC%99%80%20KVM%EC%BD%94%EB%93%9C%EB%A5%BC%20%EC%A4%91%EC%8B%AC%EC%9C%BC%EB%A1%9C%20%EB%B3%B4%EA%B8%B0(QEMU%20%EB%A7%8C%EB%93%A4%EC%96%B4%20%EB%B3%B4%EA%B8%B0)/image-20231128184115199.png)

また、[[kr/운영체제/베어메탈 부터(2) - 나만의 작은 Boot Loader 만들어보기\|以前に]]作成したブートローダの実行結果と比較してみましょう。
![image-20231128184134639.png|center round|300](/img/user/kr/%EC%9A%B4%EC%98%81%EC%B2%B4%EC%A0%9C/assets/%EA%B0%80%EC%83%81%ED%99%94,%20QEMU%EC%99%80%20KVM%EC%BD%94%EB%93%9C%EB%A5%BC%20%EC%A4%91%EC%8B%AC%EC%9C%BC%EB%A1%9C%20%EB%B3%B4%EA%B8%B0(QEMU%20%EB%A7%8C%EB%93%A4%EC%96%B4%20%EB%B3%B4%EA%B8%B0)/image-20231128184134639.png)


# 付録
仮想化技術でも様々な最適化技術が存在し、その中で最も特徴的なのはページングに関する部分でしょう。

基本的なオペレーティングシステムの場合、一度メモリ参照をするため

`メモリ参照 --> ページングテーブル参照 --> 実際のメモリ参照`。

のような流れが必要ですが、仮想化をした場合はどうでしょうか？

簡単に考えても

ゲストメモリ参照 --> ゲストページングテーブル参照 --> ゲスト実メモリ参照(?) --> ホストメモリ参照 --> ホストページングテーブル参照 --> ホスト実メモリ参照(?)`。

hmmm....🤔、いくら考えてもオーバーヘッドが大きすぎます。

このような問題を解決するため、ハードウェア仮想化時にこのようなページングテーブル参照の最適化のための機能をサポートします。

詳細は以下を参考してください。

https://en.wikipedia.org/wiki/Second_Level_Address_Translation
# 参考資料
https://shhoya.github.io/hv_intro.html
https://sites.cs.ucsb.edu/~rich/class/cs293b-cloud/notes/Virtualization/virtualization.html
https://mp.weixin.qq.com/s/jOzHdSSR4XPQPa5N5f_GCg

https://stackoverflow.com/questions/3215878/what-are-in-out-instructions-in-x86-used-for