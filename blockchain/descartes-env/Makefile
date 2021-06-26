.PHONY: start stop clean release

TAG := 1.0.0

start: stop
	docker-compose up

stop:
	docker-compose down -v

clean:
	rm -rf machines/*
	rm -rf node_modules
	sudo rm -rf deployments
	sudo rm -rf alice_data/*
	sudo rm -rf bob_data/*

release: clean
	cd .. && tar -czvf descartes-env-${TAG}.tar.gz descartes-env
