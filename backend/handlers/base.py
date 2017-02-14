import tornado.web
import json
from logger import logger
import urllib2
import os
import subprocess
import yaml


class QueryHandler(tornado.web.RequestHandler):
    def get(self, q=""):
        self.q = q
        logger.info("query for '%s'" % q)
        self.set_header('Content-Type', 'application/json')
        self.write(json.dumps(self.get_papers()))

    def get_papers(self):
        raise NotImplementedError


class FetchHandler(tornado.web.RequestHandler):
    def get(self, arg):
        self.arg = arg

        self.url = self._create_url(arg)
        logger.info("retrieve information from %s" % self.url)
        self.response = urllib2.urlopen(self.url).read()

        self.idx, self.remote_pdf, self.data = self._parse(self.response)
        logger.info("has idx %s" % self.idx)

        self.write_meta()
        self.download_pdf()
        self.create_thumb()
        logger.info("finished")
        self.set_header('Content-Type', 'application/json')
        self.write(json.dumps({"status": "ok"}))

    def write_meta(self):
        dst = 'data/%s.yml' % self.idx
        logger.info("write info into %s " % (dst))
        if not os.path.isfile(dst):
            with open('data/%s.yml' % self.idx, 'w') as outfile:
                yaml.dump(self.data, outfile, default_flow_style=False)
            logger.info("... done")
        else:
            logger.warn("file %s already exists" % dst)

    def download_pdf(self):
        self._download(self.remote_pdf, "data/" + self.idx + ".pdf")

    def _download(self, url, dst):
        logger.info("download file from %s to %s" % (url, dst))
        if not os.path.isfile(dst):
            pdf = urllib2.urlopen(url)
            with open(dst, 'wb') as output:
                output.write(pdf.read())
            logger.info("... done")
        else:
            logger.warn("file %s already exists" % dst)

    def create_thumb(self):
        logger.info("create thumbnail")
        pdf_file = "data/" + self.idx + ".pdf"
        jpg_file = pdf_file[:-4] + ".jpg"
        if not os.path.isfile(jpg_file):
            cmd = "montage " + pdf_file + "[0-7] -mode Concatenate -tile x1 -quality 80 -resize x330 -trim " + jpg_file
            proc = subprocess.Popen([cmd], stdout=subprocess.PIPE, shell=True)
            (out, err) = proc.communicate()
            logger.info("... done")
        else:
            logger.warn("file %s already exists" % jpg_file)

    def _parse(self, response):
        raise NotImplementedError

    def _create_url(self, arg):
        raise NotImplementedError


class TextHandler(tornado.web.RequestHandler):
    def get(self, q=""):
        if os.path.isfile("data/%s" % q):
            with open("data/%s" % q) as f:
                self.write(json.dumps({"data": f.read()}))
        else:
            self.write(json.dumps({"data": ""}))

    def _process(self, data):
        return data

    def post(self, q=""):
        q = self._process(q)
        with open("data/%s" % q, "w") as f:
            f.write(self.request.body)
