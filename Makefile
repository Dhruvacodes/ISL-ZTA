.PHONY: install test train eval web demo demo-fresh all clean

PYTHON = python

install:
	$(PYTHON) -m pip install -e .

test:
	$(PYTHON) -m pytest -v tests/

train:
	$(PYTHON) -m ztarb.train --profile quick

eval:
	$(PYTHON) -m ztarb.evaluate --profile quick

web:
	npm --prefix web run build

demo:
	$(PYTHON) -m ztarb.service.app

demo-fresh: eval web demo

all: install test train eval web demo

clean:
	rm -rf build/ dist/ web/dist/ *.egg-info .pytest_cache results/tmp
