import base
import os
import glob
import yaml
import HTMLParser
from logger import logger
from .. import bibtex


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


class QueryHandler(base.QueryHandler):
    def get_papers(self):
        found_papers = []
        for file in glob.glob("data/*.yml"):
            with open(file, "r") as f:
                paper = yaml.load(f)
                paper['id'] = file[5:-4]
                paper['pdf'] = file[:-4] + ".pdf"
                if os.path.isfile(file[:-4] + ".jpg"):
                    paper['jpg'] = file[:-4] + ".jpg"
                else:
                    paper['jpg'] = ""
                paper['filesize'] = file_size(file)
                paper['search_scope'] = "local"
                paper['authors'] = HTMLParser.HTMLParser().unescape(paper['authors'])
                paper['bibtex'] = bibtex.create(paper)
            found_papers.append(paper)
        logger.info("found %i papers" % len(found_papers))
        return found_papers
