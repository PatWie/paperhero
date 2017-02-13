import os
import tornado.ioloop
import tornado.web
import glob
import yaml
import json
import urllib2
import re
import subprocess
import logging
import HTMLParser
import argparse
import xmltodict

logging.getLogger('googleapicliet.discovery_cache').setLevel(logging.ERROR)
root = os.path.dirname(__file__)


# http://stackoverflow.com/a/39988702
def file_size(file_path):
    def convert_bytes(num):
        for x in ['Bytes', 'KB', 'MB', 'GB', 'TB']:
            if num < 1024.0:
                return "%3.1f %s" % (num, x)
            num /= 1024.0
    if os.path.isfile(file_path):
        file_info = os.stat(file_path)
        return convert_bytes(file_info.st_size)
    else:
        return 0


class LocalPapersHandler(tornado.web.RequestHandler):
    def initialize(self, path):
        self.path = path

    def get(self):
        self.set_header('Content-Type', 'application/json')
        self.write(json.dumps(self.local_papers()))

    def local_papers(self):
        all_data = []
        for file in glob.glob(self.path + "/*.yml"):
            with open(file, "r") as f:
                yml = yaml.load(f)
                yml['id'] = file[5:-4]
                yml['pdf'] = file[:-4] + ".pdf"
                yml['jpg'] = file[:-4] + ".jpg"
                yml['filesize'] = file_size(file)
                yml['search_scope'] = "local"
                yml['authors'] = HTMLParser.HTMLParser().unescape(yml['authors'])
            all_data.append(yml)
        return all_data


class DownloadArxivHandler(tornado.web.RequestHandler):
    def get(self, arxiv_url):
        print arxiv_url
        self.set_header('Content-Type', 'application/json')
        arxiv_url = arxiv_url.replace("org/pdf/", "org/abs/")
        arxiv_url = arxiv_url.replace(".pdf", "")

        idx = arxiv_url.replace("http://arxiv.org/abs/", "")

        if not os.path.isfile('data/%s.yml' % idx):
            data = self.parse(arxiv_url)
            with open('data/%s.yml' % idx, 'w') as outfile:
                yaml.dump(data, outfile, default_flow_style=False)

        self.download(arxiv_url, 'data/%s.pdf' % idx)
        self.get_thumb('data/%s.pdf' % idx)
        self.write(json.dumps({"status": "ok"}))

    def get_thumb(self, pdf_file):
        jpg_file = pdf_file[:-4] + ".jpg"
        if not os.path.isfile(jpg_file):
            cmd = "montage " + pdf_file + "[0-7] -mode Concatenate -tile x1 -quality 80 -resize x330 -trim " + jpg_file
            proc = subprocess.Popen([cmd], stdout=subprocess.PIPE, shell=True)
            (out, err) = proc.communicate()

    def parse(self, arxiv_url):
        page_source = urllib2.urlopen(arxiv_url).read()
        regexs = {'title': ur'Title:<\/span>(.*)<\/h1>',
                  'abstract': ur"Abstract:<\/span>(.*)<\/blockquote>",
                  'authors': ur"Authors:<\/span>(.*)<\/a><\/div>",
                  'year': ur"<div class=\"dateline\">\(Submitted on \d* [a-zA-z]* (\d*) "}

        for k in regexs.keys():
            regexs[k] = re.compile(regexs[k], re.MULTILINE | re.DOTALL)

        for k in regexs.keys():
            print "extract ", k
            try:
                rsl = re.findall(regexs[k], page_source)[0].strip()
                rsl = re.sub('<[^<]+?>', '', rsl)
                rsl = rsl.replace("\n", "")
                # rsl = HTMLParser.HTMLParser().unescape(rsl)
                print "found .... ", rsl
                regexs[k] = rsl
            except Exception:
                regexs[k] = "nA"

        regexs['authors'] = HTMLParser.HTMLParser().unescape(regexs['authors'].replace("\n", ""))
        regexs['publisher'] = ""
        regexs['booktitle'] = ""
        regexs['editor'] = ""
        regexs['pages'] = ""
        regexs['url'] = "%s" % str(arxiv_url)
        return regexs

    def download(self, arxiv_url, dst):
        if not os.path.isfile(dst):
            arxiv_url = arxiv_url.replace("org/abs/", "org/pdf/")
            if not arxiv_url.endswith(".pdf"):
                arxiv_url = arxiv_url + ".pdf"
            pdffile = urllib2.urlopen(arxiv_url)
            with open(dst, 'wb') as output:
                output.write(pdffile.read())
            print arxiv_url


class QueryArxivHandler(tornado.web.RequestHandler):

    def get(self, q=""):
        self.set_header('Content-Type', 'application/json')
        self.write(json.dumps(self.web_papers(q)))

    def web_papers(self, q=None):
        query = "http://export.arxiv.org/api/query?search_query=cat:cs.CV+AND+ti:+%s&start=0&max_results=25" % q
        raw_result = urllib2.urlopen(query).read()
        d = xmltodict.parse(raw_result)
        all_data = []
        for entry in d['feed']['entry']:
            try:
                pp = dict()
                pp['title'] = entry['title']
                pp['id'] = entry['id'].replace("http://arxiv.org/abs/", "")
                pp['authors'] = "; ".join([str(x['name']) for x in entry['author']    ])
                pp['year'] = entry['published']
                pp['url'] = entry['id']
                pp['abstract'] = entry['summary']
                pp['search_scope'] = 'web'
                all_data.append(pp)
            except Exception:
                pass
        return all_data


class Application(tornado.web.Application):
    def __init__(self, args):
        super(Application, self).__init__(args)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('-p', "--port", default="8888", type=int)
    args = parser.parse_args()

    print("start Application ...")
    application = Application([
        (r'/papers/local', LocalPapersHandler, dict(path="data")),
        (r'/papers/web/(.*)', QueryArxivHandler),
        (r'/fetch/arxiv/(.*)', DownloadArxivHandler),
        (r"/(.*)", tornado.web.StaticFileHandler, {"path": root, "default_filename": "template/index.html"})
    ])

    print("listen on %i ..." % args.port)
    application.listen(args.port)
    tornado.ioloop.IOLoop.instance().start()
