---
tags:
  - C_Lang/Hacker/RarePattern
created: 2023-10-23
updated: 2023-11-15
글확인: true
dg-publish: true
---


잘 보이진 않지만 가끔씩 보이는 C 언어 문법을 정리.

# C 언어
## :n - bit field 선언자(declaration)

### 예시
bit field 선언자를 붙이면 변수의 bit 크기를 지정하게 됨
```c
// two-bit int field, allowed values are -1, 0, 1, 2
int a:2; 

// three-bit unsigned field, allowed values are 0...7
unsigned int b : 3;
```
### 참조
https://en.cppreference.com/w/cpp/language/bit_field

# 매크로
## \# 연산자 - Stringizing 

문자열로 치환

```c
#define str(x) #x 

// str (foo) --> "foo"
```

### 예시
```c
//https://github.com/thopiekar/rcraid-dkms/blob/master/src/version.h

#define RC_STRINGIFY(s) #s
#define RC_MK_BUILD_VER(RC_BUILD_VER_MAJOR, RC_BUILD_VER_MINOR, RC_BUILD_VER_PATCH) \
                  RC_STRINGIFY(RC_BUILD_VER_MAJOR)"." \
                  RC_STRINGIFY(RC_BUILD_VER_MINOR)"." \
                  RC_STRINGIFY(RC_BUILD_VER_PATCH)
```

### 참조
https://gcc.gnu.org/onlinedocs/cpp/Stringizing.html

## \#\# 연산자 - Concatenation
토큰을 치환해서 붙여넣기

### 예시
```c
#define INT_N(n) int i##n

// INT_N(0) --> int i0
// INT_N(1) --> int i1

int main() {
    INT_N(0) = 123;
    INT_N(1) = 321;
    printf("Hello %d, %d", i0, i1); // --> Hello 123, 321

    return 0;
}
```

### 참조
https://gcc.gnu.org/onlinedocs/cpp/Concatenation.html
# 코딩 스타일
## 구조체의 가변 크기
구조체는 기본적으로 정의와 함께 크기가 정해지는 것이 일반적이지만, 혹시 가변적으로 사용하고 싶은 경우(예를 들어서 내가 선언한 구조체 아래에 추가적인 데이터가 들어있는 것을 나타내고 싶을 때) 아래와 같이 적을 수 있다.

### 예시
```c
// https://github.com/neilbrown/mdadm/blob/master/super-intel.c
struct imsm_map {
	__u32 pba_of_lba0_lo;	/* start address of partition */
.
.
	__u32 filler[4];	/* expansion area */
#define IMSM_ORD_REBUILD (1 << 24)
	__u32 disk_ord_tbl[1];	/* disk_ord_tbl[num_members],
				 * top byte contains some flags
				 */
};
```
즉 `__u32 disk_ord_tbl[1]`과 같이 배열을 둠으로써 나타내는 패턴이 등장할 때가 있다.