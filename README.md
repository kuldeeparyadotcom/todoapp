# TODO App
### Demo
[YouTube](https://youtu.be/xjWrvF9q6C8?si=iKiaDva7yLdIV7QH)
</br>
[LinkedIn](https://www.linkedin.com/posts/activity-7280837358894071808-x-Pf)

### Set up
1. Run redis in docker container. Redis is used to store session.
`docker run -d --name redis-stack -p 6379:6379 -p 8001:8001 redis/redis-stack:latest`
2. Run cassandra in docker container. Cassandara is used to store todo items.
`docker run --name cassandra -d -p 9042:9042 cassandra:latest`
3. run `OPENAI_API_KEY='your-open-api-key-here' nodemon start` from "todoapp" directory.
4. Run `npm start` from the directory - "todoapp/frontend"
