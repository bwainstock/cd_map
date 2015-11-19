from werkzeug.debug import DebuggedApplication
from table import app

if __name__ == "__main__":
	app = DebuggedApplication(app, evalex=True)
	app.run()
