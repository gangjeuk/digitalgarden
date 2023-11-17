function getMapbyTag(data) {
  let mapping = {};

  (data.collections.note || []).forEach((note) => {
    for (let tag of note.data.tags) {
      // ignore gardenEntry page, note, Book tags
      if (
        tag.indexOf("gardenEntry") != -1 ||
        tag.indexOf("note") != -1 ||
        tag.indexOf("Book") != -1
      ) {
        continue;
      }
      // Generate map
      // Example:
      //   '한나아렌트': [ '/notes/kr/기록/독후감/예루살렘의 아이히만' ],
      //   '경제': [ '/notes/kr/기록/독후감/폴트 라인(Fault Lines)' ],
      //   'CTF/basic/ELF': [
      //   '/notes/jp/CTF/Basic/ELF from scratch',
      //   '/notes/kr/CTF/Basic/ELF 파일 형식에서 재배치(Relocation), 링킹(Linking) 까지'
      //   ]
      if (mapping.hasOwnProperty(tag)) {
        mapping[tag].push(note.filePathStem);
      } else {
        mapping[tag] = [note.filePathStem];
      }
    }
  });

  //console.log(mapping);
  return mapping;
}

// @input: path
// Example:/notes/jp/computer/list
// @return: 'ja' or 'ko' or 'en'
function getLangbyPath(path) {
  let ret = path.split("/")[2];
  if (ret == "jp") {
    return "ja";
  } else if (ret == "kr") {
    return "ko";
  }
  return ret;
}

// @input: mapping
// Example:
//   '한나아렌트': [ '/notes/kr/기록/독후감/예루살렘의 아이히만' ],
//   '경제': [ '/notes/kr/기록/독후감/폴트 라인(Fault Lines)' ],
//   'CTF/basic/ELF': [
//   '/notes/jp/CTF/Basic/ELF from scratch',
//   '/notes/kr/CTF/Basic/ELF 파일 형식에서 재배치(Relocation), 링킹(Linking) 까지'
//   ]
//
// @return: mapping(filtered)
// Example:
//   'CTF/basic/ELF': [
//   '/notes/jp/CTF/Basic/ELF from scratch',
//   '/notes/kr/CTF/Basic/ELF 파일 형식에서 재배치(Relocation), 링킹(Linking) 까지'
//   ]
function filterMultiLang(mapping) {
  // Deep copy
  let ret = JSON.parse(JSON.stringify(mapping));

  for (let key in mapping) {
    // key MUST include '/'
    // Example:
    // CTF/basic/ELF
    if (key.split("/").length == 1) {
      delete ret[key];
      continue;
    }
    const pageLinks = mapping[key];
    // Only support 'en', 'kr', 'jp'
    if (pageLinks.length > 3) {
      delete ret[key];
      continue;
    }

    let enCount = 0,
      jpCount = 0,
      krCount = 0;

    for (let pageLink of pageLinks) {
      if (getLangbyPath(pageLink) == "ja") {
        jpCount += 1;
      } else if (getLangbyPath(pageLink) == "en") {
        enCount += 1;
      } else if (getLangbyPath(pageLink) == "ko") {
        krCount += 1;
      }
    }

    if (enCount >= 2 || jpCount >= 2 || krCount >= 2) {
      delete ret[key];
      continue;
    }

    if (
      (enCount == 1 && jpCount == 1) ||
      (enCount == 1 && krCount == 1) ||
      (jpCount == 1 && krCount == 1)
    ) {
      continue;
    }

    delete ret[key];
  }
  //console.log(ret);

  return ret;
}

// @input: mapping(filtered)
// Example:
//   'CTF/basic/ELF': [
//   '/notes/jp/CTF/Basic/ELF from scratch',
//   '/notes/kr/CTF/Basic/ELF 파일 형식에서 재배치(Relocation), 링킹(Linking) 까지'
//   ]
// @return: mapping(structed)
function getStructedMapping(mapping) {
  let ret = [];

  for (let tag in mapping) {
    let xhtml = [];
    for (let notePath of mapping[tag]) {
      let lang = getLangbyPath(notePath);
      let urlPath = notePath.replace("/notes/", "/") + "/";
      xhtml.push({ rel: "alternate", hreflang: lang, href: urlPath });
    }

    for (let notePath of mapping[tag]) {
      let tmp = {};
      tmp[notePath] = xhtml;
      ret.push(tmp);
    }
  }

  //console.log(ret);
  return ret;
}

// Put your computations here.
function userComputed(data) {
  let mapping = [];
  mapping = getMapbyTag(data);
  mapping = filterMultiLang(mapping);
  mapping = getStructedMapping(mapping);
  console.log(mapping);
  return { mapping };
}

exports.userComputed = userComputed;
