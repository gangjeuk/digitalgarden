```dataview
LIST WITHOUT ID "[" + embed(cover) + "](<" + file.folder + "/" + file.name + ">)"
FROM #📚Book 
WHERE dg-publish = true
SORT file.ctime ASC
LIMIT 7
```