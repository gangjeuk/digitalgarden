---
{"dg-publish":true,"permalink":"/kr/지식나눔/LazyVim 설치 및 설정하기/","tags":["Tips/LazyVim"],"created":"2023-11-11","updated":"2023-11-11"}
---




평소에 NeoVim을 IDE처럼 설정해 주는 LazyVim을 사용하여 Vim을 꾸며보자.

# LazyVim
LazyVim은 기본적으로 NeoVim의 setup 중 하나이고, 그냥 NeoVim의 설정모음집 같은 거라고 보면 된다.

LazyVim이 외에도 LunarVim, AstroNvim, SpaceVim 등이 존재한다고 하는데 이번에 이러한 setup의 존재를 처음 알았기 때문에 맨 처음 접한 LazyVim을 중심으로 어떻게 설치를 진행하고 세팅을 하는지 알아보자.

# 설치
쉽게 사용하는 것이 목적인 만큼 설치 과정이 굉장히 쉽다.
## Backup
먼저 현재 사용하고 있는 NeoVim 관련 설정의 백업을 생성한다. (별도의 설정이 없으면 삭제해도 된다)

NeoVim 과 관련된 설정파일은 nvim 디렉터리에 들어있다.
```bash
# required
mv ~/.config/nvim{,.bak}

# optional but recommended
mv ~/.local/share/nvim{,.bak}
mv ~/.local/state/nvim{,.bak}
mv ~/.cache/nvim{,.bak}
```

## Install LazyVim
다음으로 GIt에서 LazyVim을 자동으로 설치해 주는 파일을 다운로드하자.

```bash
git clone https://github.com/LazyVim/starter ~/.config/nvim
```
그리고 `.git` 디렉터리를 삭제하자.

```bash
rm -rf ~/.config/nvim/.git
```
마지막으로 그냥 NeoVim을 실행하면 된다!

```bash
nvim
```

## Plugin 설치
설치가 끝난 다음에 다음 화면이 나타나면 이제 `l` 를 눌러서 lazy로 진입하자.

![image-20231111185327420.png](/img/user/kr/%EC%A7%80%EC%8B%9D%EB%82%98%EB%88%94/assets/LazyVim%20%EC%84%A4%EC%B9%98%20%EB%B0%8F%20%EC%84%A4%EC%A0%95%ED%95%98%EA%B8%B0/image-20231111185327420.png)

아래와 같은 사진에서 자기 입맛에 맞는 플러그인을 설치할 수 있다.

아래 목록은 LazyVim에서 기본적으로 설정된 플러그인들이고, 그 외 필요한 플러그인들을 추가로 설치하는 것도 가능하다.
![image-20231111192139348.png](/img/user/kr/%EC%A7%80%EC%8B%9D%EB%82%98%EB%88%94/assets/LazyVim%20%EC%84%A4%EC%B9%98%20%EB%B0%8F%20%EC%84%A4%EC%A0%95%ED%95%98%EA%B8%B0/image-20231111192139348.png)

무엇이 어떤 역할을 하는 플러그인이 알고 싶은 사람은 아래의 링크를 참조하면 된다.

- https://www.lazyvim.org/plugins

또는 `e` (Lazy Extras)키를 눌러서 추가로 설치할 수 있는 플러그인 목록 (최근에 뜨고 있는 인공지능 코드 서포터 사용, 언어별 지원 확장 등을 추가 가능)을 확인하는 것도 가능하다.

설치 가능한 플러그인 중에 아래의 목록을 선택해서 설치해 보자 (또는 자신에 맞는 걸로)

- `formatting.prettier`
- `lang.clangd`
- `lang.cmake`
- `lang.markdown`
- `lang.python`
# Reference
https://www.lazyvim.org/
