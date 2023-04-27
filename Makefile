all:
	docker-compose up --build

start:
	docker-compose start

stop:
	docker-compose stop
	
prune:
	docker system prune

rmc:
	docker container rm -f backend postgres adminer frontend

rmi:
	docker rmi -f backend postgres adminer frontend

status:
	docker images
	docker ps -a
