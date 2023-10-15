---
{"dg-publish":true,"permalink":"/CTF/Basic/ELF and Linking - Relocation Explained/","tags":["CTF/basic","TODO/need_to_upload"]}
---

# Reference
[[elf-64-gen.pdf]]
[[elf-64-hp.pdf]]
https://www.sco.com/developers/gabi/2012-12-31/contents.html
# ELF Format
ELF(Executable and Linking Format)은 대표적으로 3가지 유형의 타입을 가진다

1. *relocatable file* → executable 또는 shared object file을 생성하기 위해 코드와 데이터를 가지는 파일
2. *executable file* → 프로세스를 생성(실행)하기에 적합한 파일
3. *shared object file* → Linking 을 위한 데이터와 코드를 가지는 파일. 여기서 Linking이란 
	1. Link editor 가 shared object file을 relocatable 또는 shared object file을 이용해 다른 object file을 생성하는 것
	2. dynamic linker 가 프로세스를 생성하기 위해서 shared object file과 executable file을 합치는 것


하지만, 결국 3가지 유형을 큰 그림으로 생각하면 결국 오브젝트 파일은 *Linking*과 *Execution* 이라는 큰 역할을 기준으로 구분할 수 있다.

역할을 기준으로 나타낸 그림을 살펴보면 아래와 같다

![image-20231005122731689.png](/img/user/CTF/Basic/assets/ELF%20and%20Linking%20-%20Relocation%20Explained/image-20231005122731689.png)

- ELF Header: 파일의 구성에 대한 ''road map''을 가진다
	- ELF 파일 형식, 실행 머신의 아키텍처 등
- Section header table: 파일의 섹션들에 대한 정보를 가진다
	- 각 Section의 entry 주소, entry 이름, Section 크기 등
	- reloaction file과 같이 링킹을 위해서 사용되는 파일은 필수로 가져야 한다
	- executable file과 같이 실행을 위한 파일에는 필요 없다
- Section: 오브젝트 파일의 링킹을 위한 정보를 가진다
	- Instruction, data, symbol table, relocation information 등
- Program header table: 시스템에 프로세스를 어떻게 실행시켜야 하는지에 대한 정보를 가진다
	- executable file과 같은 실행을 위한 파일에는 필요하다
	- 당연하게도 relocation file과 같은 실행에 관심이 없는 파일에는 필요 없다
- Segment: 여러 개의 section 으로 구성된 구조체

Segment는 위에서 설명한 그대로 복수의 Section들로 구성된 구조체이다.

예를 들어 보통 Data Segment라고 들어본 데이터가 들어있는 Segment의 경우 다음과 같은 Section 들로 구성되어 있다.

| Data Segment | Description                 |
| ------------ | --------------------------- |
| .data        | Initialized data            |
| .dynamic     | Dynamic linking information |
| .got         | Global offset table         |
| .bss         | Uninitialized data          |

# 실습 준비
## Hello World!!(Executable file)
아래에서 진행하는 실습을 위해서 간단한 바이너리를 생성해서 진행한다.

진행을 위해서 Hello, World!!를 출력하는 프로그램을 작성하여 컴파일을 진행하였다.

```c
// title: hello.c
#include <stdio.h>

int main(){
        char* hello = "Hello, World!!";
        printf("%s\n", hello);
        return 0;
}
```

컴파일은 다음과 같이 진행하였다.
```bash
gcc hello.c -o hello
```
## Global(Linking)
같이 Linking을 살펴보기 위해 간단한 바이너리를 생성하였다.

프로그램은 아래와 같다.
```c
// title: global.c

int global_var = 1;

void func_A(void){
        global_var = 123;
}

int start(void)
{
        func_A();
        return 0;
}
```

```bash
gcc -c -ffreestanding global.c

#-c: create object file
#-ffreestanding: compile without library
```



# Data Structure 
위에서 소개한 각각의 헤더와 구조에 대하여 실제 어떤 구조체로 구성되는지를 살펴보자.

먼저 Data Type 은 다음과 같다.

![image-20231006122304854.png](/img/user/CTF/Basic/assets/ELF%20and%20Linking%20-%20Relocation%20Explained/image-20231006122304854.png)

## File header
```c
typedef struct
{
unsigned char e_ident[16]; /* ELF identification */
Elf64_Half e_type; /* Object file type */
Elf64_Half e_machine; /* Machine type */
Elf64_Word e_version; /* Object file version */
Elf64_Addr e_entry; /* Entry point address */
Elf64_Off e_phoff; /* Program header offset */
Elf64_Off e_shoff; /* Section header offset */
Elf64_Word e_flags; /* Processor-specific flags */
Elf64_Half e_ehsize; /* ELF header size */
Elf64_Half e_phentsize; /* Size of program header entry */
Elf64_Half e_phnum; /* Number of program header entries */
Elf64_Half e_shentsize; /* Size of section header entry */
Elf64_Half e_shnum; /* Number of section header entries */
Elf64_Half e_shstrndx; /* Section name string table index */
} Elf64_Ehdr;

```
파일 헤더의 경우 
- 매직넘버 - ELF...
- 머신: x86, ARM, MIPS, ...
- 운영체제: Linux, Unix, System V
등의 정보를 가지고 있다.

자세한 플래그 값들의 리스트는 [[ELF_Format.pdf]]의 5 page에 나온다.

여기서 자세히 보아야 하는 값은 앞으로 나올 [[CTF/Basic/ELF and Linking - Relocation Explained#Section\|Section]]과 [[CTF/Basic/ELF and Linking - Relocation Explained#Program\|Program]]에서 다루어질 Section header, Program header의 위치를 가리키는 *e_phoff*, *e_shoff*이다.

각 헤더는 엔트리로 구성되고 다음과 같은 구조로 되어있다.

![entries.png](/img/user/CTF/Basic/assets/ELF%20and%20Linking%20-%20Relocation%20Explained/entries.png)
### Section header entry
먼저 Section entry의 구조체의 경우 다음과 같은 구조로 되어있다.

```c
typedef struct
{
Elf64_Word sh_name; /* Section name */
Elf64_Word sh_type; /* Section type */
Elf64_Xword sh_flags; /* Section attributes */
Elf64_Addr sh_addr; /* Virtual address in memory */
Elf64_Off sh_offset; /* Offset in file */
Elf64_Xword sh_size; /* Size of section */
Elf64_Word sh_link; /* Link to other section */
Elf64_Word sh_info; /* Miscellaneous information */
Elf64_Xword sh_addralign; /* Address alignment boundary */
Elf64_Xword sh_entsize; /* Size of entries, if section has table */
} Elf64_Shdr;
```
Section에서 가장 먼저 살펴봐야 할 필드는 *sh_type*, *sh_flags*이다.

sh_type의 경우 말 그대로 Section의 타입을 결정한다.
Section의 타입에는, 아무것도 들어있지 않는 NULL Section, 링커의 심볼 정보를 담는 Section, 다이나믹 링킹 정보를 가지고 있는 Section 등이 존재한다.

위 sh_type에 따라서 Section이 가지는 특성이 달라지는데 그것을 표현한 것이 sh_flags이다.

sh_flags의 경우 Section의 메모리 탑재 여부, 쓰기 가능 여부 등을 결정하는 플래그들이 존재한다.

예를 간단하게 살펴보자

#### Example
아무 바이너리를 가지고 다음과 같은 명령어로 간단하게 Section에 대한 정보를 얻을 수 있다.

```bash
readelf -a hello
```

가장 대표적인 영역인 .text, .rodata, .data 영역을 살펴보자

```bash
Section Headers:
  [Nr] Name              Type             Address           Offset
       Size              EntSize          Flags  Link  Info  Align
---------------------------------------------------------------------
  [16] .text             PROGBITS         0000000000001060  00001060
       0000000000000113  0000000000000000  AX       0     0     16
  .
  .
  [18] .rodata           PROGBITS         0000000000002000  00002000
       0000000000000013  0000000000000000   A       0     0     4
  .
  . 
  [25] .data             PROGBITS         0000000000004000  00003000
       0000000000000010  0000000000000000  WA       0     0     8
```

다음과 같이 정리될 수 있다.

| Field name | Flags |
| ---------- | ----- |
| .text      | AX    |
| .rodata    | A     |
| .data      | WA    |

각 플래그의 의미는 다음과 같다
```bash
Key to Flags:
  W (write), A (alloc), X (execute), M (merge), S (strings)...
```

간단하게 해석하자면 Read only data인 rodata는 메모리에 적재되지만 쓰기가 불가능한 것을 알 수 있다.(당연하게도!)

또 일반 데이터인 data의 경우는 당연히 적재되고 쓰기도 가능하다.

마지막으로 text의 경우 메모리에 적재되지만 쓰기가 아닌 읽기만이 가능하다.
### Program 
Program header table의 Entry는 다음과 같은 구조로 되어있다.
```c
typedef struct
{
Elf64_Word p_type; /* Type of segment */
Elf64_Word p_flags; /* Segment attributes */
Elf64_Off p_offset; /* Offset in file */
Elf64_Addr p_vaddr; /* Virtual address in memory */
Elf64_Addr p_paddr; /* Reserved */
Elf64_Xword p_filesz; /* Size of segment in file */
Elf64_Xword p_memsz; /* Size of segment in memory */
Elf64_Xword p_align; /* Alignment of segment */
} Elf64_Phdr;
```
Program header table에서 처음으로 ==Segment==라는 단어를 볼 수 있는데, 위에서 말 언급했듯이 Segment는 여러 Section의 모임이다.

Program header table에서 Segment라는 단어가 등장하는 이유를 여기서 알 수 있는데 Program header table은 말 그대로 프로그램이 실행할 때의 메모리 영역에 대한 권한을 어떻게 설정해야 하는지를 설정하기 위해 존재하기 때문이다.

그러한 목적 달성을 위해서 메모리의 주소(*p_vaddr*, *p_paddr*), 메모리의 크기(*p_memsz*), 메모리 플래그(*p_flags* - 읽기 쓰기 등을 조절)의 필드가 존재하는 것을 알 수 있다.

#### Example
예시로서 다시 한번 같은 명령어를 사용해서 살펴보자
(보기 쉽게 하기 위해서 약간의 조작을 가했다)

```bash
Program Headers:
  Type           Offset             VirtAddr           PhysAddr
                 FileSiz            MemSiz              Flags  Align
---------------------------------------------------------------------
  .
  .
  LOAD[2]           0x0000000000000000 0x0000000000000000 0x0000000000000000
                 0x0000000000000628 0x0000000000000628  R      0x1000
  LOAD[3]           0x0000000000001000 0x0000000000001000 0x0000000000001000
                 0x0000000000000181 0x0000000000000181  R E    0x1000
  LOAD[4]           0x0000000000002000 0x0000000000002000 0x0000000000002000
                 0x00000000000000f4 0x00000000000000f4  R      0x1000
  LOAD[5]           0x0000000000002db8 0x0000000000003db8 0x0000000000003db8
                 0x0000000000000258 0x0000000000000260  RW     0x1000
  .
  .
 Section to Segment mapping:
  Segment Sections...
   00
   01     .interp
   02     .interp .note.gnu.property .note.gnu.build-id .note.ABI-tag .gnu.hash .dynsym .dynstr .gnu.version .gnu.version_r .rela.dyn .rela.plt
   03     .init .plt .plt.got .plt.sec .text .fini
   04     .rodata .eh_frame_hdr .eh_frame
   05     .init_array .fini_array .dynamic .got .data .bss
   .
   .
```

먼저 Segment의 구성에 대해서 살펴보자.

05 Segment에 우리에게 친숙한 .data, .bss, .got 등이 보인다, 즉 여기는 아마도 메모리에 적재되고 쓰기가 가능한 구역의 모임일 것이다.

또한 LOAD\[5\] 영역을 살펴보면 플래그가 RW 인 것을 알 수 있고 예상과 일치함을 알 수 있다. 

# Linking
이제 ELF 파일 또는 OS의 프로그램 실행의 꽃이라고 할 수 있는 Linking과정에 대해서 알아보자.

관련 설명은 [[CTF/Basic/GOT, GOT.PLT Explained\|GOT, GOT.PLT Explained]], [[CTF/Basic/Thread Local Storage Explained\|Thread Local Storage Explained]] 등에서 진행한 내용과 비슷한 면이 존재한다.(어차피 어느 메모리 주소로 점프하게 조작하느냐 만 다를 뿐 CPU의 동작을 컨트롤한다는 점에서는 동일하다)

잡설은 여기까지 하고 먼저 앞에서 설명한 [[CTF/Basic/ELF and Linking - Relocation Explained#Section header entry\|Section header entry]]를 다시 한번 상기하자.

먼저 사용되는 구조체는 다음과 같았다.

```c
typedef struct
{
Elf64_Word sh_name; /* Section name */
Elf64_Word sh_type; /* Section type */
Elf64_Xword sh_flags; /* Section attributes */
Elf64_Addr sh_addr; /* Virtual address in memory */
Elf64_Off sh_offset; /* Offset in file */
Elf64_Xword sh_size; /* Size of section */
Elf64_Word sh_link; /* Link to other section */
Elf64_Word sh_info; /* Miscellaneous information */
Elf64_Xword sh_addralign; /* Address alignment boundary */
Elf64_Xword sh_entsize; /* Size of entries, if section has table */
} Elf64_Shdr;
```
이제 우리가 주목해야 할 영역은 
- *sh_name*
- *sh_link*
- *sh_info*

필드이다.

먼저 sh_name의 자세한 구조는 [[ELF_Format.pdf]]를 참고하고,  위에서 사용한 readelf 명령어를 사용해서 바이너리를 살펴보면 다음과 같은 이름을 가진 Section을 볼 수 있을 것이다.

```bash
# readelf -a global
Section Headers:
  [Nr] Name              Type             Address           Offset
       Size              EntSize          Flags  Link  Info  Align
  .
  .
  [ 2] .text             PROGBITS         0000000000000000  00000060
       0000000000000029  0000000000000000  AX       0     0     1
  [ 3] .rela.text        RELA             0000000000000000  00000260
       0000000000000030  0000000000000018   I      10     2     8
```

```bash
# readelf -a hello
Section Headers:
  [Nr] Name              Type             Address           Offset
       Size              EntSize          Flags  Link  Info  Align
  .
  .
  [10] .rela.dyn         RELA             0000000000000550  00000550
       00000000000000c0  0000000000000018   A       6     0     8
  [11] .rela.plt         RELA             0000000000000610  00000610
       0000000000000018  0000000000000018  AI       6    24     8
```

다음과 같이 .rel 또는 .rela 가 앞에 붙은 경우 그 Section이 ==재배치 가능==하다는 의미가 된다.

다음으로 sh_link와 sh_info의 경우 sh_type에 따라서 아래의 그림과같이 다양한 의미로 쓰이게 되는데,

![image-20231006152734451.png](/img/user/CTF/Basic/assets/ELF%20and%20Linking%20-%20Relocation%20Explained/image-20231006152734451.png)

우리가 관심 있는 ==재배치 가능==(.rel, .rela 영역)의 경우 보통 *Index*을 의미하게 된다.

Linking에 대해서 더 설명하기 전에 전체적인 구조를 먼저 살펴보면 다음과 같다.

일단 컴파일한 Section의 전체 정보가 다음과 같을 때.

```bash

Section Headers:
  [Nr] Name              Type             Address           Offset
       Size              EntSize       Flags  Link(=sh_link)  Info(=sh_info)  Align
  [ 0]                   NULL             0000000000000000  00000000
       0000000000000000  0000000000000000           0     0     0
  [ 1] .note.gnu.pr[...] NOTE             0000000000000000  00000040
       0000000000000020  0000000000000000   A       0     0     8
  [ 2] .text             PROGBITS         0000000000000000  00000060
       0000000000000029  0000000000000000  AX       0     0     1
  [ 3] .rela.text        RELA             0000000000000000  00000260
       0000000000000030  0000000000000018   I      10     2     8
  [ 4] .eh_frame         PROGBITS         0000000000000000  00000090
       0000000000000058  0000000000000000   A       0     0     8
  [ 5] .rela.eh_frame    RELA             0000000000000000  00000290
       0000000000000030  0000000000000018   I      10     4     8
  [ 6] .data             PROGBITS         0000000000000000  000000e8
       0000000000000004  0000000000000000  WA       0     0     4
  [ 7] .bss              NOBITS           0000000000000000  000000ec
       0000000000000000  0000000000000000  WA       0     0     1
  [ 8] .comment          PROGBITS         0000000000000000  000000ec
       000000000000002e  0000000000000001  MS       0     0     1
  [ 9] .note.GNU-stack   PROGBITS         0000000000000000  0000011a
       0000000000000000  0000000000000000           0     0     1
  [10] .symtab           SYMTAB           0000000000000000  00000120
       0000000000000120  0000000000000018          11     9     8
  [11] .strtab           STRTAB           0000000000000000  00000240
       000000000000001f  0000000000000000           0     0     1
  [12] .shstrtab         STRTAB           0000000000000000  000002c0
       000000000000006c  0000000000000000           0     0     1
```

sh_link 와 sh_info의 의미를 생각해서 각 Section에 대한 그림을 그리면 다음과 같다.

![image-20231006154233302.png](/img/user/CTF/Basic/assets/ELF%20and%20Linking%20-%20Relocation%20Explained/image-20231006154233302.png)

실제 재배치에 필요한 정보를 가지는  Symbol Table Section 과 Relocation Section은 [[CTF/Basic/ELF and Linking - Relocation Explained#File header\|위와]]같이 각각 엔트리로 구성되어 있다. 

![image-20231006184427053.png](/img/user/CTF/Basic/assets/ELF%20and%20Linking%20-%20Relocation%20Explained/image-20231006184427053.png)



## Symbol Table Entry(.symtab)
먼저 Symbol Table Section의 Entry는 다음과 같다.

```c
typedef struct
{
Elf64_Word st_name; /* Symbol name */
unsigned char st_info; /* Type and Binding attributes */
unsigned char st_other; /* Reserved */
Elf64_Half st_shndx; /* Section table index */
Elf64_Addr st_value; /* Symbol value */
Elf64_Xword st_size; /* Size of object (e.g., common) */
} Elf64_Sym;
```
각 Entry는 하나의 심볼에 대한 정보를 가지고 이름, 타입, 값, 어느 Section에 존재하는지(Section index)로 구성된다.
## Relocation Entry(.rela, .rel)
다음으로 Relocation Section의 Entry는 다음과 같다.
```c
typedef struct
{
Elf64_Addr r_offset; /* Address of reference */
Elf64_Xword r_info; /* Symbol index and type of relocation */
} Elf64_Rel;

typedef struct
{
Elf64_Addr r_offset; /* Address of reference */
Elf64_Xword r_info; /* Symbol index and type of relocation */
Elf64_Sxword r_addend; /* Constant part of expression */
} Elf64_Rela;
```

Rellocation Entry는 두 개의 종류로 구성되는데 실제로 Relocation이 적용되는 메모리 주소의 오프셋(r_offset), 어떻게 Rellocation이 진행되어야 하는지(r_info), 마지막으로 메모리 주소를 계산할 때 더해야 할 값(r_addend)으로 구성된다.

본 문서에서는 .rela를 위주로 살펴본다.
## Address Calculation
실제 주소의 계산은 [[CTF/Basic/ELF and Linking - Relocation Explained#Relocation Entry(.rela, .rel)\|Relocation Entry]]장에서 설명한  r_info를 이용해서 이루어진다.

r_info는 재배치를 수행할 위치의 심볼이 심볼의 몇 번째 엔트리에 있는지에 대한 정보와 ==어떻게 재배치할 것인지에 대한 정보를 가진다==.

x86의 경우 아래와 같은 재배치 방식이 존재한다.

| 재배치 타입   | 재배치를 수행할 필드의 크기 | 더해줄 값을 계산하는 방식 |
| ------------- | --------------------------- | ------------------------- |
| R_X86_64_PC32 | 32                          | S+A-P                     |
| R_X86_64_64   | 64                          | S+A                       |
| ...           | ...                         | ...                       | 
이 외에도 [[CTF/Basic/Thread Local Storage Explained\|TLS(Thread Local Storage)]]와 Dynamic Linking 등을 위한 다양한 방식이 존재한다.

여기서 등장하는 S, A, P는 각각
- S: 재배치 후에 해당 심볼의 실제 위치
	- 계산식: st_value + 심볼이 정의된 섹션이 로딩된 어드레스
- P: 재배치 해야하는 부분의 위치
	- 계산식: r_offset + 재배치를 수행하는 섹션이 로딩된 어드레스
- A: 더해지는 값 = r_addend

이제 재배치에 사용되는 데이터의 종류와 쓰임새 그리고 재배치의 실제 메모리 주소값을 계산하는 방법까지 살펴보았다.

이제 실제 계산이 실제로 어떻게 진행되는지 살펴보자.
## Procedure
사용 프로그램으로는 [[CTF/Basic/ELF and Linking - Relocation Explained#실습 준비\|2 번째 프로그램(Global)]]을 사용할 것이다.

먼저 readelf 프로그램으로 Section, Relocation entry에 대한 정보, Symbol Table에 대한 정보를 확인하자.

```bash
# Section
----------------------------------------------------------------------------------
Section Headers:
  [Nr] Name              Type             Address           Offset
       Size              EntSize          Flags  Link  Info  Align
	.
	.
  [ 2] .text             PROGBITS         0000000000000000  00000060
       0000000000000029  0000000000000000  AX       0     0     1
  [ 3] .rela.text        RELA             0000000000000000  00000260
       0000000000000030  0000000000000018   I      10     2     8
	.
	.
  [ 6] .data             PROGBITS         0000000000000000  000000e8
       0000000000000004  0000000000000000  WA       0     0     4

# Relocation
----------------------------------------------------------------------------------
Relocation section '.rela.text' at offset 0x260 contains 2 entries:
  Offset          Info           Type           Sym. Value    Sym. Name + Addend
00000000000a  000900000002 R_X86_64_PC32     0000000000000000 global_var - 8
00000000001e  000a00000004 R_X86_64_PLT32    0000000000000000 func_A - 4

# Symbol Table
----------------------------------------------------------------------------------
Symbol table '.symtab' contains 12 entries:
   Num:    Value          Size Type    Bind   Vis      Ndx Name
	.
	.
     8: 0000000000000000     0 FILE    LOCAL  DEFAULT  ABS global.c
     9: 0000000000000000     4 OBJECT  GLOBAL DEFAULT    6 global_var
    10: 0000000000000000    21 FUNC    GLOBAL DEFAULT    2 func_A
    11: 0000000000000015    20 FUNC    GLOBAL DEFAULT    2 start
```

다음으로 디컴파일을 다음과 같은 명령어로 진행하여 보자.

```bash
DESKTOP objdump -d global

-d: decompile .text section
```

```bash
Disassembly of section .text:

0000000000000000 <func_A>:
   0:   f3 0f 1e fa             endbr64
   4:   55                      push   %rbp
   5:   48 89 e5                mov    %rsp,%rbp
   8:   c7 05 00 00 00 00 7b    movl   $0x7b,0x0(%rip)        # 12 <func_A+0x12>
   f:   00 00 00
  12:   90                      nop
  13:   5d                      pop    %rbp
  14:   c3                      ret

0000000000000015 <start>:
  15:   f3 0f 1e fa             endbr64
  19:   55                      push   %rbp
  1a:   48 89 e5                mov    %rsp,%rbp
  1d:   e8 00 00 00 00          call   22 <start+0xd>
  22:   b8 00 00 00 00          mov    $0x0,%eax
  27:   5d                      pop    %rbp
  28:   c3                      ret
```

먼저 실제 offset이 계산되는 메모리 주소를 확인하기 위해서 .rela.text의 Entry 들의 r_offset 값을 확인하면 다음과 같다.

- ==00000000000a==  000900000002 R_X86_64_PC32     0000000000000000 global_var - 8
- ==00000000001e==  000a00000004 R_X86_64_PLT32    0000000000000000 func_A - 4

각각의 주소가 0xa, 0x1e인 것을 알 수 있고, 형식 또한 R_X86_64_PC32, R_X86_64_PLT32로 32bit만큼의 메모리를 변경하는 것을 알 수 있다.

즉 

func_A 함수의
  -  8:   c7 05 ==00 00 00 00== 7b    movl   $0x7b,0x0(%rip)        # 12 <func_A+0x12>

start 함수의
  - 1d:   e8 ==00 00 00 00==          call   22 <start+0xd>

이다.

> [!Hint]
> x64의 call 과 mov 명령의 형식은 다음과 같다
> #### CALL
> |Opcode|Instruction|Op/  <br>En|64-bit  <br>Mode|Compat/  <br>Leg Mode|Description|
> |---|---|---|---|---|---|
> |E8 cw|CALL rel16 |M|N.S.|Valid|Call near, relative, displacement relative to next instruction.|
> |E8 cd| CALL rel32|M|Valid|Valid|Call near, relative, displacement relative to next instruction. 32-bit displacement sign extended to 64-bits in 64-bit mode|
>#### MOV
> |Opcode|Instruction|Op/  <br>En|64-Bit  <br>Mode|Compat/  <br>Leg Mode|Description|
> |---|---|---|---|---|---|
> |C7 /0 iw|MOV r/m16 imm16|MI|Valid|Valid|Move imm16 to r/m16.|
> |C7 /0 id|MOV r/m32 imm32|MI|Valid|Valid|Move imm32 to r/m32.|



의미상으로는 변수를 메모리로 mov 하는 명령, start 함수에서 다른 함수를 call하는 명령어의 목표(오퍼랜드)가 되는 주소를 변경하여
변수의 주소를 global_var의 주소로, call하는 함수의 주소를 func_A의 주소로 변경한다는 것이 된다.

이제(드디어!) r_offset이 가리기는 주소의 값을 계산해 보자.

목표는 글로벌 변수인 global_var의 주소의 계산과 func_A의 주소를 각각 계산하는 것이다.

하지만, 계산을 진행하기 전에 머리에 먼저 그림을 그리고 들어가자.

우리가 원하는 궁극적인 목표는 메모리의 값의 변화이고, 구체적으로는 현재 실행 중인 명령어의 주소에서 목표가 되는 변수 또는 함수의 주소를 메모리의 값으로 넣어주는 것이다(생각보다 단순하다).

### global_var
먼저 *global_var*을 대상으로 지금까지 정리한 내용을 이용하여 값을 계산해 보자.

전체적은 구조는 다음과 같다.
![image-20231010151410269.png](/img/user/CTF/Basic/assets/ELF%20and%20Linking%20-%20Relocation%20Explained/image-20231010151410269.png)

계산식은 다음과 같고
Address: <span class="green">S</span> + <span class="blue">A</span> + <span class="yellow">P</span>  
위에서 [[CTF/Basic/ELF and Linking - Relocation Explained#Address Calculation\|주어진 식]]을 조금 더 풀어 쓰면 다음과 같다.
$$
\color{green} st\_value + .data \color{blue} + r\_append \color{yellow} - (r\_offset + .text )
$$
계산 결과는 $\text{0x0 + 0xE8 + (-8) - (0x0A + 0x60)= 0x76}$ 이다.

이제 이 값을 실제 넣고 어떻게 해석되는지 살펴보자.

```bash
Before
-------------
c7 05 00 00 00 00 7b    mov    DWORD PTR [rip+0x0],0x7b

After
------------
c7 05 76 00 00 00 7b    mov    DWORD PTR [rip+0x76],0x7b 
```
현재 진행 중인 명령어 주소(rip)에서 0x76을 더하는 걸 알 수 있다.

mov 명령을 실행 중일 때 rip의 값은 0x12 + 0x60(.text 주소) 인 것을 알 수 있고(다음 실행할 명령어를 가리킴).

$\text{0x72+0x76 = 0xE8}$ 로 *globar_var*의 주소를 가리키는 것을 알 수 있다.


### func_A
다음으로 *func_A*이다.

비슷한 흐름으로 계산을 진행하면서 값들을 넣어준다고 생각하면 계산식은 다음과 같다.

$$
\color{green} st\_value + .text \color{blue} + r\_append \color{yellow} - (r\_offset + .text )
$$
같은 .text의 값이 소거되고 함수의 주소를 가리켜야 함으로 .text의 안의 영역을 가리키는 것을 예상할 수 있다.

 값을 대입하면 $\text{0x00 + 0x60 + (-4) - (0x1E + 0x60)= -0x22}$ 임으로 음수인 것을 알 수 있다.

값이 대입되는 주소가 start 함수 안이고 start 함수의 주솟값이 높음으로 음수가 나오는 것이 자연스러운 것을 알 수 있다.

call의 위치 또한 rip 레지스터의 값인 0x22와 동일함으로, 0x22-0x22=0인 주소, 즉 func_A를 call 하는 것을 알 수 있다.


# 결론

ELF 파일의 형식 과 실제 실행파일이 운영체제에서 동작하기 위해 필요한 링킹 과정에 대해서 살펴보았다.

이야기가 긴 만큼 한 번에 이해하기 어려울 수 있기 때문에 마지막으로 전체구조를 정리한 그림을 첨부한다.

필요한 경우 옆에 같이 두면서 한번 더 읽으면 이해하기 수월할 것이다.

![image-20231010161636907.png](/img/user/CTF/Basic/assets/ELF%20and%20Linking%20-%20Relocation%20Explained/image-20231010161636907.png)


