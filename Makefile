PWD = $(shell pwd)

run: run_srv run_cli
  

run_srv: 
	pushd srv && source venv/bin/activate && python api.py

run_cli: 
	pushd cli && quasar dev