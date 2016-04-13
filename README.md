# Clip
clip 是抓取提交豆瓣数据的一个小工具，写这个的最初目的就是为了整理我在豆瓣上的电影标签。在几年前我也写过一个C#下基于豆瓣公开API的版本，豆瓣自己的API是有多难用啊。所以这个版本从根本上完全采用网页抓取数据的方法，使用上相对自由。
ps：毕竟不是官方API，使用时要注意豆瓣会把你判定为机器人。

文档什么的我真的懒得写，源码大概看一下就会用了，例子都是我自己的实际应用。

## movie

### 核心方法

- [x] 获取电影信息

    `movie.getFilmInfo(filmId, cb)`


- [x] 获取用户的电影收藏

    `movie.getUserCol(userId, state, query, cb)`
 

- [x] 获取用户使用的标签

    `movie.getUserTags(userId, query, cb)`

     
- [x] 提交电影评论信息

    `movie.postFilmReview(filmId, interest, rating, tagList, comment, cb)`


- [x] 删除电影评论信息

    `movie.delFilmReview(filmId, cb)`
    
    
### 扩展方法

- [x] 获取自动标签列表

    `movie.getAutoTags(film, option, cb)`


- [x] 获取用户所有的电影收藏
    
    `movie.getUserAllCol(userId, state, query, cb)`


### TODO    
    
- [ ] 预告片
- [ ] 图片
- [ ] 获奖
- [ ] 豆列
- [ ] 短评
- [ ] 问题
- [ ] 影评
- [ ] 影人
