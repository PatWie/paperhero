import tornado.web
import json
import os


class NotesHandler(tornado.web.RequestHandler):
    def get(self, q=""):
        if os.path.isfile("data/%s.md" % q):
            with open("data/%s.md" % q) as f:
                self.write(json.dumps({"notes": f.read()}))
        else:
            self.write(json.dumps({"notes": ""}))

    def post(self, q=""):
        print q
        with open("data/%s.md" % q, "w") as f:
            f.write(self.request.body)
