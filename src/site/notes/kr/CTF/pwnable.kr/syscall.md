---
{"dg-publish":true,"permalink":"/kr/CTF/pwnable.kr/syscall/","tags":["CTF/pwnable-kr/syscall"],"created":"2023-11-29","updated":"2023-11-29"}
---

# 문제 코드
```c
// adding a new system call : sys_upper

#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/slab.h>
#include <linux/vmalloc.h>
#include <linux/mm.h>
#include <asm/unistd.h>
#include <asm/page.h>
#include <linux/syscalls.h>

#define SYS_CALL_TABLE		0x8000e348		// manually configure this address!!
#define NR_SYS_UNUSED		223

//Pointers to re-mapped writable pages
unsigned int** sct;

asmlinkage long sys_upper(char *in, char* out){
	int len = strlen(in);
	int i;
	for(i=0; i<len; i++){
		if(in[i]>=0x61 && in[i]<=0x7a){
			out[i] = in[i] - 0x20;
		}
		else{
			out[i] = in[i];
		}
	}
	return 0;
}

static int __init initmodule(void ){
	sct = (unsigned int**)SYS_CALL_TABLE;
	sct[NR_SYS_UNUSED] = sys_upper;
	printk("sys_upper(number : 223) is added\n");
	return 0;
}

static void __exit exitmodule(void ){
	return;
}

module_init( initmodule );
module_exit( exitmodule );
```

# 풀이
취약점은 `sys_upper`함수에 존재하고, `syscall` 호출 상황에서 메모리 curruption이 발생 가능한 조건이다.

취약점과 별도로 이걸 어떻게 응용해야 하는지를 몰라서 조사하여 인터넷에 풀이를 참조하였다.

조사 후, 커널 Exploit에서 보편적으로 사용되는 함수인 `commit_creds`, `prepare_kernel` 가 존재하는 것을 알았고, `commit_creds(prepare_kernel_cred(0));` 형식으로 많이 사용한다고 한다.

여기에 더해서 문제 해결을 위해서는 2 가지 문제를 더 풀어야 하는데,

첫 번째로 syscall table을 조작하는 것과 

두 번째로 `commit_creds` 함수의 주소가 `0x8003f56c` 인 것이다 

첫 번째는 함수 인자에 맞는 syscall을 적절히 조작하면 되고 주소가 `0x6c`인 것은 실제 주소인 `0x6c`와 점프 주소인 `0x60` 사이에 슬로프를 설치하는 식으로 문제를 풀 수 있다.



# POC

```embed-c
PATH: 'vault://CTF/pwnable.kr/assets/syscall/answer.c'

```
