---
created: 2023-04-11
dg-publish: true
cover: "[[image-20231101191458108.png]]"
---




---
`hello world`

```
hello world

```

## 자식 쉘

- 프로세스 실행 명령 목록(세미콜론(;)으로 구별)
```
$ pwd; ls; cd /etc ; pwd ; cd ;
```
- 명령목록이 프로세스 목록으로 간주되가 위해서 괄호로 둘러싸기
```
$ (pwd; ls; cd /etc ; pwd; cd ;)  --> 서브쉘에서 실행된다
+
서브쉘에서의 실행을 확인하기위해 환경변수 $BASH_SUBSHELL을 이용가능
$ echo $BASH_SUBSHELL -> 서브쉘 없으면 0, 있으면 1
```

## 프로세스 목록을 백그라운드 모드로 돌리기

1. & 사용하기
```
$ (sleep 2 ; echo $BASH_SUBSHELL ; sleep 2)  --> 서브쉘 실행후 다시 돌아옴
$ (sleep 2 ; echo $BASH_SUBSHELL ; sleep 2)& --> 백그라운드 모드 실행
```
2. coproc 명령어 사용하기
```
기본
$ coproc sleep 10
별칭 지정하기
$ coproc My_job { sleep 10; }  --> 세미콜론(;) 필수 + 중괄호(}) 사이 빈 칸 필수
여러단계 서브쉘 생성
$ coproc ( sleep 10; sleep 2)
```
## 환경변수 살펴보기
- 전역 변수
```
$ printenv  --> 개별 환경변수 출력 가능
$ env
```
- 지역 변수
```
$ set  --> 지역, 전역, 사용자 정의 변수 출력
```
- 환경 변수 삭제하기
```
$ unset
```
### 변수 관련 
1. 자식 쉘 안에서 설정된 지역 변수는 부모 쉘로 돌아간 후에는 더 이상 존재하지 않는다
2. 자식 쉘 안에서 전역 환경 변수를 변경하면 부모 쉘의 변수 값에는 영향을 주지 않는다

### 환경 변수 리스트 

| 변수     |     설명    |
| -------- | ---------- |
| CDPATH   | cd 명령에 대한 검색 경로로 사용되는, 콜론으로 구분된 디렉토리 목록|
|HOME      |현재 사용자의홈 디렉토리|
|IFS       |셀이 텍스트 문자열을 분할할 때사용하는, 필드를 구분하는 문자들의 목록|
|MAIL      |현재 사용자의 메일박스 파일 이름(bash 셀은 새 메일이 왔는지 보기 위해 이 파일을 검사한다)|
|MAILPATH  |현재 사용자의 받은 메일함에 대한, 콜론으로 구분된 여러 파일 이름의 목록|
|OPTARG    |getopt 명령이 처리한 마지막 옵션 매개변수의 값|
|OPTIND    |getopt 명령이 처리한 마지막 옵션 매개변수의 인덱스 값|
|PATH      |셀이 명령을 찾을 때 쓸, 콜론으로 구분된 디렉토리 목록|
|PS1       |기본 셀 커맨드라인 인터페이스 프롬프트 문자열|
|PS2       |보조 셀 커맨드라인 인터페이스 프롬프트 문자열|

### bash쉘 환경 변수
[bash 쉘 환경변수](지식나눔/Linux%20cmd/etc/bash_env.md)

____________________

# Bash 문법정리

### Bash 배열
```
$ mytest=(one two three four five) --> 괄호('()')로 정의
$ echo $mytest --> 첫번째 원소를 리턴
$ echo ${mytest[2]}  --> 대괄호로 감싼 후 번호지정 필요
$ echo ${mytest[*]}  --> 전체 배열 변수 표시
```

### 명령 치환
명령의 출력으로부터 정보를 추출하고 이를 변수에 할당할 수 있는 기능
- 역따옴표 문자(`)
- $() 형식

### 간단한 계산
expr, bc 명령어를 사용해서 간단한 계산 가능
- expr 부동소수점 계산 불가능
- bc 부동소수점 계산 가능
```
$ var1=$[1 + 5]  --> $[] 을 사용하면 수식으로 인식 가능(expr 보다 이쪽 추천)
$ var2=$[$var1 * 2]

$ var1=$(echo "scale=4; 3.44 / 5" | bc) --> 파이프 이용 계산 결과 획득 + 
										부동소수점 연산시 scale(표현 자리수) 지정 필요
```
____________________
## 특별 변수

| 변수 | 의미 |
|------|------|
| $?   | [종료상태](지식나눔/Linux%20cmd/etc/bash_return_status.md) |
| $1 - 9 | 매개변수 |
| $0 | 경로 포함 스크립트 이름 |
| $(basename $0) | 경로 없는 순수 스크립트 이름|
| $# | 매개변수 숫자(갯수)|
| ${!#} | 마지막 매개변수($$#, ${$#} 는 안된다!!) |
| $* | 모든 매개변수를 하나의 단어로 |
| $@ | 문자열로 분리된 단어로 (for문 에서는 $@)|
| $$ | 쉘 PID |

____________________
## 구조적 명령어
- if-then 구문 [[kr/지식나눔/Linux cmd/Bash#if-then 구문\|Bash#if-then 구문]]
- test 명령어 [[kr/지식나눔/Linux cmd/Bash#test 명령어\|Bash#test 명령어]]
- 복합 조건 테스트 [[kr/지식나눔/Linux cmd/Bash#복합 조건 테스트\|Bash#복합 조건 테스트]]
- 이중 대괄호 및 괄호 [[kr/지식나눔/Linux cmd/Bash#이중 대괄호 및 괄호\|Bash#이중 대괄호 및 괄호]]
- case 구문 [[kr/지식나눔/Linux cmd/Bash#case 구문\|Bash#case 구문]]

### if-then 구문
```
if command  --> command의 성공여부에 따른 분기 
then
	commands
elif command2
then
	more commands
else
	commands
fi
```
또는 
```
if command; then
	commands
elif command2; then
	more commands
else
	commands
fi
```

### test 명령어 
Bash에서 구문의 명령의 종료 상태 코드 말고도 다른 조건을 평가할 수 있다.
```
if test condition
then
	명령
fi
```
보통 위 코드가 아닌
이하의 코드를 사용한다
```
if [ condition ] --> 여는 대괄호 뒤와 닫는 대괄호 앞에 빈 칸이 있어야 한다
then
	명령
fi
```
test명령와 [ condition ]구문은 이하의 3개에 대한 평가를 할 수 있다.
- 숫자 비교 
- 문자열 비교
- 파일 비교

숫자의 경우 ( -eq, -ge, -gt, -le, -lt, -ne )로 비교가능 
`if [ $value1 -gt 5 ]; then` 과 같이 사용가능

문자열의 경우 ( =, !=, \<, \>, -n(길이가 0보다 큰지), -z(길이가 0인지) )로 비교가능
`if [ $USER = gangjeuk ]; then` 과 같이 사용가능

파일 비교의 경우 [이하에서 확인 가능](지식나눔/Linux%20cmd/etc/Bash_file_test.md) 
`if [ -d $jump_directory ] --> 디렉토리 확인` 과 같이 사용 가능


### 복합 조건 테스트
테스트를 결합하는 부울 논리를 사용할 수 있다.
```
[ condition1 ] && [ condition2 ]
[ condition1 ] || [ condition2 ]
```
`if [ -d $HOME ] && [ -w $HOME/testing ]` 과 같이 사용가능
### 이중 대괄호 및 괄호
이중 괄호 명령은 비교에 고급 수학 공식을 통합할 수 있다
```
(( expression )) --> 이중 괄호 내에서는 이스케이프가 필요 없다
if (( $val1 ** 2 > 90 )); then
```
으로 사용 가능

이중 대괄호 명령은 문자열 비교에 대한 고급 기능을 제공한다
```
[[ expression \| expression ]] --> 테스트 명령 평가의 표준 문자열 비교를 사용한다 + 패턴 일치를 제공
if [[ $USER == r* \| $USER == r* ]] 
```
와 같이 사용 가능 하다.

### case 구문
구문 형태는 이하와 같다
```
case variable in
pattern1 | pattern2) commands1;;
pattern3) commands2;;
*) default commands;;
esac
```
__________
## 고급 구조적 명령 

### for 구문

구문 형태는 이하와 같다
```
for var in list
do 
	commands
done
```

### 예
- 목록에서 값을 읽기 [[kr/지식나눔/Linux cmd/Bash#예\|Bash#예#목록에서 값을 읽기]]
- 변수에서 목록 읽기(리스트에 변수 추가하기) [[kr/지식나눔/Linux cmd/Bash#예\|Bash#예#변수에서 목록 읽기(리스트에 변수 추가하기)]]
- 명력에서 값 읽기 [[kr/지식나눔/Linux cmd/Bash#예\|Bash#예#명력에서 값 읽기]]
- 필드 구분자 변경하기(IFS 변경) [[kr/지식나눔/Linux cmd/Bash#예\|Bash#예#필드 구분자 변경하기(IFS 변경)]]
- 와일드카드 사용(예: 디렉토리 읽기) [[kr/지식나눔/Linux cmd/Bash#예\|Bash#예#와일드카드 사용(예: 디렉토리 읽기)]]
- C 스타일 for 명령(+ 여러 변수 사용하기) [[kr/지식나눔/Linux cmd/Bash#예\|Bash#예#C 스타일 for 명령(+ 여러 변수 사용하기)]]

#### 목록에서 값을 읽기


#### 변수에서 목록 읽기(리스트에 변수 추가하기)
```
for test in a b c d e
do 
	echo The next state is $test
done
```
[코드 예](Linux%20cmd/asset/linux_cmd/ch13/test1.sh)
#### 명력에서 값 읽기
```
list="Alabama Alaska Arizona Arkansas Colorado"
list=$list" Connecticut"
```
[코드 예](Linux%20cmd/asset/linux_cmd/ch13/test4.sh)

#### 필드 구분자 변경하기(IFS 변경)
특수 환경 변수인 IFS를 변경하여 bash쉘이 필드 구분자로 사용하는 문자의 목록을 정의한다

기본적으로 
- 빈 칸
- 탭
- 줄바꿈
3개 이며, 쉘은 데이터에서 이러한 문자를 보게 되면 목록 안에서 새 데이터 필드가 시작된다고 본다.
```
IFS=$'\n' 
```
으로 설정 하면, 빈 칸과 탭을 무시하고 줄바꿈 만을 필드 구분자로 사용한다
[코드 예](Linux%20cmd/asset/linux_cmd/ch13/test5b.sh)

#### 와일드카드 사용(예: 디렉토리 읽기)
이러한 사용법도 가능하다
```
for file in /home/user/test/*
```
[코드 예](Linux%20cmd/asset/linux_cmd/ch13/test6.sh)

#### C 스타일 for 명령(+ 여러 변수 사용하기)
C 언어 스타일의 for문 사용이 가능하다
그리고, 여러 변수를 사용하는 것도 가능하다
```
for (( variable assignment ; condition ; iteration process ))
# 할당문에 빈 칸을 포함
# 변수 앞에 달러 기호가 붙지 않음
# 반복 프로세스의 수식에 expr 명령 형식이 사용되지 않음
for (( i=1; i <= 10; i++ ))
for (( a=1, b=10, a <= 10; a++, b-- ))
```

## while 문

기본 while 형식
```
while test command
do
	other commands
done
```

## until 문
```
until test commands
do
	other commands
done
```

### 파일 데이터에 대한 반복 작업 예제
[코드 예](지식나눔/Linux%20cmd/etc/linux_cmd/ch13/passwd_test.sh)

## break 명령
break문은 기본적으로 가장 안쪽에 있는 루프를 종료시킨다

바깥쪽 루프 밖으로 빠져나오기 위해서는
```
break n
```
형식으로 매개변수를 지정해야 한다.
## continue 명령

continue도 오느 수준의 루프를 속개할 것인가를 정할 수 있다.
```
continue n
```
## loop 문의 출력을 리다이렉트 하기
```
for file in /home/rich/*
do
	...
done > output.txt # or pipe # done | sort
```
와 같이 done 옆에 리다이렉션(또는 파이프) 기호를 붙임으로써 for 명령의 결과를 리다이렉트한다.

_______________
# 사용자 입력 처리

## 기본적인 입력
### 특변 변수 [[kr/지식나눔/Linux cmd/Bash#특별 변수\|Bash#특별 변수]]

### shift 명령(기능)
매개변수 조작을 위한 명령.

매개변수의 상대적 위치만큼 이동(시프트) 시킨다.

```
shift n
```
과 같이, 여러 매개변수를 시프트 시킬 수도 있다.

## getopt 명령 - getopts(getopt의 발전형)

사용예
```
getopt ab:cd -a -b test1 -cde test2 test3

getopt -q ab:cd -a -b test1 -cde test2 test3
```

### getopt와 set명령
사용예
```
set -- $(getopt -q ab:cd "$@")
```

## 읽기의 기초
### read 명령
read는 표준 입력 또는 다른 파일 디스크립터에서 하나의 입력을 받아 드린다
```
read name
echo "Hello, $name"
```
-p 옵션을 사용하면 같은 줄에서 입력을 받을 수 있다
```
read -p "Please enter your age: " age
echo "I'm $age"
```

read 명령은 환경 변수 REPLY에 입력 받은 모든 데이터를 저장한다

-t 옵션을 사용하면 입력 시간에 제한을 둘 수 있다.
```
if read -t 5 -p "Please enter your name: " name
```
-n[숫자] 옵션을 사용하면 입력받는 문자의 길이를 정의 할 수 있다.
[y/n] 대답 등에 사용 가능하다
```
read -n1 -p "Do you want to continue [Y/N]? " answer
```
-s 옵션을 사용하면 화면에 표시하지 않고 읽는 것이 가능하다
비밀번호 입력등에 사용 가능하다
```
read -s -p "Enter you password: " password
```
파일에 저장된 데이터를 읽을 때도 사용 가능하다
```
cat README.md | while read line
```
[코드 예](지식나눔/Linux%20cmd/etc/linux_cmd/ch14/test28.sh)

_________________
# 데이터 보여주기
   
## 리다이렉트

### 오류를 리다이렉트
```
ls -al badfile 2> test4   # STDERR의 값을 리다이렉트
```
### 오류와 데이터를 리다이렉트
```
# 각자 따로 리다이렉트
ls -al test test2 test3 badfile 2> error.txt 1> output.txt
# STDOUT, STDERR을 모두 리다이렉트
ls -al test test2 test3 badfile &> all.txt
```

## 일시 리다이렉트
아래와 같은 형식으로 출력의 목적지를 선택 가능
```
>&2
# ex
echo "This is an error message" >&2
```

## 지속적인 리다이렉트(exec을 이용한)
exec 명령은 새로운 쉘을 시작하고 STDOUT 파일 디스크립터를 파일로 리다이렉트한다. 

```
exec 2> testerror
exec 1> testerror

```

[코드 예](./etc/linux_cmd/ch14/)

반대로 표준입력의 입력의 출처를 파일로 바꾸등의 응용도 가능하다
```
exec 0< testfile
while read line     # read는 표준입력에서 값을 읽을려고 한다
```

! 주의
+ exec로 설정된 리다이렉션은 계속 유지된다
+ STDOUT 또는 STDERR을 리다이렉트한 후, 원래의 장소로 쉽게 돌려 놓기가 힘들다.
+ 사용자 정의 리다이렉트 만들기 [[kr/지식나눔/Linux cmd/Bash#사용자 정의 리다이렉트 만들기\|Bash#사용자 정의 리다이렉트 만들기]] 에서 사용할 수 있는 요령을 설명한다

## 사용자 정의 리다이렉트 만들기

### 출력 파일 디스크립터 만들기
디스크립터는 3~8까지의 숫자이며 입력 또는 출력 리다이렉트 중 하나로 활용할 수 있다.

### 파일 디스크립터를 리다이렉트하기
```
exec 3>&1         # 3에 입력되는 값은 1의 출력이 가리키는 모니터에 출력된다
exec 1>test14out  # 1의 출력은 모니터에서 test14out파일로 설정된다

echo "This should store in the output file"

exec 1>&3  # 1의 출력은 3이 가리키는 모니터로 설정된다(원래 설정)
echo "Now thing should be back to normal"
```
일시적으로 스크립트 파일에 리다이렉트하고 나서 나중에 다시 출력을 원래 설정으로 되돌리기 위해서 널리 쓰이는 방법이다.

### 입력 파일 디스크립터 만들기
비슷하게 입력의 출처의 리다이렉트를 보관하고 다시 되돌리는 방법도 사용할 수 있다.
```
exec 6<&0   # STDIN의 입력 출처인 모니터를 6에 저장

exec 0< testfile # STDIN의 입력 출처를 파일로 설정

while read line # read 는 STDIN에서 값을 읽는다. 현재는 출처인 파일을 읽는다
do
	...
done
exec 0<&6    # STDIN의 입력 출처를 6의 입력 출처인 모니터로 설정한다
```

### 읽기/쓰기용 파일 디스크립터 만들기
입력과 출력 모두를 할 수 있는 파일 디스크립터를 열 수 있다.

특히 주의를 요한다. 모든 읽기 또는 쓰기 작업을 파일 포인터가 마지막으로 가리키고 있는 곳에서 이루어진다.

```
exec 3<> testfile  # 3의 출력을 파일로, 3의 입력 출처를 파일로 설정
```

### 파일 디스크립터 닫기

```
exec 3> testfile

echo "This is a test line for 3" >&3

exec 3>&-

echo "This won't work" >&3
```
파일 디스크립터를 닫은 후에는 스크립트에서 닫힌 디스크립터를 향해 데이터를 기록하는 것이 불가능해진다.

기록하려고 하면 쉘은 오류 메시지를 낸다.

### 기타
- 열린 파일 디스크립터 나열하기
	- lsof 명령으로 모든 프로세스와, 모든 사용자를 포함한 정보를 출력
	- lsof -a -p $$ -d 0,1,2
		- a: all
		- p: PID($$는 쉘PID)
		- d: Descripter
- 명령 출력 억제하기
	- /dev/null로의 리다이렉트
- 임시 파일 사용하기
	- 로컬 임시 파일 만들기
		- mktemp 명령
		- mktemp testing.XXXXXX
		- 6개의 X가 필요하다
		- -t 옵션은 /tmp에 파일을 만들도록 한다
	- 임시 디렉토리 만들기
		- mktemp 명령
		- -d 옵션은 임시 디렉토리를 만들도록 한다
- 메세지 로깅(tee 명령)
	- STDIN의 데이터를 2개의 목적지로 보낸다
	- tee tesfile의 경우 STDOUT과 testfile이 그 목적지가 된다
	- -a 옵션의 경우 append로 파일에 데이터를 이어서 쓴다

_______________________________
# 함수 만들기

- [[kr/지식나눔/Linux cmd/Bash#기본 스크립트 함수\|Bash#기본 스크립트 함수]]
- [[kr/지식나눔/Linux cmd/Bash#값을 돌려주기\|Bash#값을 돌려주기]]
- [[kr/지식나눔/Linux cmd/Bash#함수에서 변수 사용하기\|Bash#함수에서 변수 사용하기]]
- [[kr/지식나눔/Linux cmd/Bash#배열 및 가변 함수\|Bash#배열 및 가변 함수]]
- [[kr/지식나눔/Linux cmd/Bash#재귀 함수\|Bash#재귀 함수]]
- [[kr/지식나눔/Linux cmd/Bash#라이브러리 만들기\|Bash#라이브러리 만들기]]
- [[kr/지식나눔/Linux cmd/Bash#커맨드라인에서 함수 사용하기\|Bash#커맨드라인에서 함수 사용하기]]

## 기본 스크립트 함수
함수 선언 형식 두 가지

```
function name {
	commands
}

name() {
commands
}
```
함수가 정의되기 전에 이를 사용하려고 하면 오류 메시지가 나타난다

함수 사용하기
```
function func1{
	echo "This is an example of a function"
}

count=1
while [ $count -le 5 ]
do
   func1
done
```

## 값을 돌려주기
bash쉘은 함수를 미니 스크립트처럼 다루며 종료 상태와 함께 종료된다.

아무런 지정이 없을 경우 bash쉘은 함수의 마지막 명령의 성공 여부에 따라서 종료 상태를 변수 $?에 지정한다.

[코드 예](Linux%20cmd/asset/linux_cmd/ch17/test4.sh)
[코드 예](지식나눔/Linux%20cmd/etc/linux_cmd/ch17/test4b.sh)

특정 종료 상태를 반환 하고 싶을때는 return 명령을 사용한다.

return 명령을 사용하기 위한 조건은 
- 함수가 완료되었을 때 될 수 있는 대로 빨리 값을 저장하기(종료 상태는 변수 $?에 저장되고 쉽게 변경 가능)
- 종료 상태는 0에서 255의 범위 안에 있어야 함

큰 정수값 또는 문자열을 돌려줘야 한다면 함수의 출력을 사용해야한다

```
function dbl{
   read -p "Enter a value: " value
   echo $[ $value * 2 ]
}

result=$(dbl)
```
와 같이 $()로 반환값을 변수에 지정할 수 있다.


## 함수에서 변수 사용하기

bash쉘은 함수를 미니 스크립트처럼 다룬다. 이는 보통의 스크립트처럼 함수에도 매개변수를 전달할 수 있다는 것을 뜻한다.

즉, 
 - $0: 함수의 이름
 - $1: 첫번째 변수
 - $#: 매개변수 수

등과 같은 사용이 가능하다.

물론, 이들 변수는 스크립트의 메인에서 쓰이는 변수와는 다르다. 함수에서 이들 값을 사용하려면 함수를 호출할 때 직접 값을 넘겨주어야 한다

함수를 지정할 때에는 함수와 같은 커맨드라인에 매개변수를 제공해야 한다.
```
func1 $value 10
```

### 변수의 scope
스크립트에는 두 종료의 변수를 사용한다.

- 전역(global) 변수
- 지역(local) 변수

기본적으로 스크립트에서 정의한 모든 변수는 전역 변수이다. 즉, 함수의 외부에서 정의된 변수는 함수안에서 사용할 수 있다. 

함수 안에서 사용되는 모든 변수를 local 키워드를 사용해서 지역 변수로 선언할 수 있다.


## 배열 및 가변 함수

배열을 함수에 전달하고, 또는 반대로 함수에서 변수를 반환하기 위해서는 배열 변수를 개별 값으로 분해하여 변수를 함수 매개변수로 사용해야 한다(echo 문으로 새로운 변수로 선언해야 한다).

즉 아래와 같이 전달해야 한다.
```
function test1 {
	local newarray
	newarry=(;'echo "$@"')
}
myarray=(1 2 3 4 5)
test1 ${myarray[*]}
```

반대로 배열을 돌려주기 위해서는 
```
function test1 {
	local newarray
	newarray=(1 2 3 4 5)
	echo ${newarray[*]}
}
myarray=(1 2 3 4 5)
result=($(test1 ${myarray[*]}))
```
## 재귀 함수

## 라이브러리 만들기
source 명령어를 사용하여 함수 라이브러리를 사용할 수 있다.
## 커맨드라인에서 함수 사용하기
