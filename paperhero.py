import os
import tornado.ioloop
import tornado.web
import argparse
import backend.handlers as handlers
from logger import logger


root = os.path.dirname(__file__)


class Application(tornado.web.Application):
    def __init__(self, args):
        super(Application, self).__init__(args)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('-p', "--port", default="8888", type=int)
    args = parser.parse_args()

    logger.info("start Application ...")
    application = Application([
        (r'/papers/local/(.*)', handlers.local.QueryHandler),
        (r'/papers/arxiv/(.*)', handlers.arxiv.QueryHandler),
        (r'/fetch/arxiv/(.*)', handlers.arxiv.FetchHandler),
        (r'/text/(.*)', handlers.base.TextHandler),
        (r'/thumb/create/(.*)', handlers.base.ThumbHandler),
        (r"/(.*)", tornado.web.StaticFileHandler, {"path": root, "default_filename": "template/index.html"})
    ])

    logger.info("listen on %i ..." % args.port)
    application.listen(args.port)
    tornado.ioloop.IOLoop.instance().start()
