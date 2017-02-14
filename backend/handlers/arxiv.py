import base
import urllib2
import xmltodict
from logger import logger


def parse_arxiv_entry(entry):
    paper = dict()
    paper['title'] = str(entry['title'])
    paper['id'] = str(entry['id'].replace("http://arxiv.org/abs/", "").split("v")[0])
    paper['abstract'] = str(entry['summary']).replace("\n", "")
    try:
        authors = [x.values()[0] for x in entry['author']]
    except Exception as e:
        logger.warn(e)
        authors = entry['author']
    paper['authors'] = "; ".join(authors)
    paper['year'] = str(entry['published'])
    paper['url'] = str(entry['id'])
    paper['search_scope'] = 'arxiv'
    return paper


class QueryHandler(base.QueryHandler):
    def get_papers(self):
        if self.q == "":
            return []
        cats = "+OR+".join(["cat:cs.CV", "cat:cs.AI", "cat:cs.LG", "cat:cs.CL", "cat:cs.NE", "cat:stat.ML"])
        q = "http://export.arxiv.org/api/query?search_query=%s+AND+all:+%s&start=0&max_results=25" % (cats, self.q)
        logger.info("query url is  %s" % q)
        raw_xml = xmltodict.parse(urllib2.urlopen(q).read())
        found_papers = []
        if 'entry' in raw_xml['feed'].keys():
            logger.info("found %i papers" % len(raw_xml['feed']['entry']))
            if not isinstance(raw_xml['feed']['entry'], list):
                # ugly fix for single paper
                entries = [raw_xml['feed']['entry']]
            else:
                entries = raw_xml['feed']['entry']

            for entry in entries:
                try:
                    found_papers.append(parse_arxiv_entry(entry))
                except Exception as e:
                    logger.warn(e)
            logger.info("analyzed %i papers" % len(found_papers))
        return found_papers


class FetchHandler(base.FetchHandler):
    def _create_url(self, arg):
        return "http://export.arxiv.org/api/query?search_query=id:+%s&start=0&max_results=25" % arg

    def _parse(self, response):
        try:
            d = xmltodict.parse(response)
            if 'feed' in d.keys():
                if 'entry' in d['feed'].keys():
                    paper = parse_arxiv_entry(d['feed']['entry'])
                    paper['search_scope'] = "arxiv"
                    remote_pdf = "http://arxiv.org/pdf/%s.pdf" % paper['id']
                    return paper['id'], remote_pdf, paper
        except Exception:
            return []
