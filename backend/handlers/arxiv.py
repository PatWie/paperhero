import base
import urllib2
import feedparser
from logger import logger

feedparser._FeedParserMixin.namespaces['http://a9.com/-/spec/opensearch/1.1/'] = 'opensearch'
feedparser._FeedParserMixin.namespaces['http://arxiv.org/schemas/atom'] = 'arxiv'


def parse_arxiv_entry(entry):
    paper = dict()
    paper['title'] = entry.title
    paper['id'] = entry.id.split('/abs/')[-1].split("v")[0]
    paper['abstract'] = entry.summary.replace("\n", "")
    try:
        authors = '; '.join(author.name for author in entry.authors)
    except Exception as e:
        logger.warn(e)
        authors = ''
    paper['authors'] = authors
    paper['year'] = str(entry.published)
    paper['url'] = str(entry.id)
    paper['search_scope'] = 'arxiv'
    return paper


class QueryHandler(base.QueryHandler):
    def get_papers(self):
        if self.q == "":
            return []
        rsl = self.query(self.q)
        print len(rsl)
        if len(rsl) == 0:
            rsl = self.query(self.q, cats=[])
        return rsl

    def query(self, q, cats=None):
        self.q = self.q.replace(' ', '%20')
        if cats is None:
            cats = ["cat:cs.CV", "cat:cs.AI", "cat:cs.LG", "cat:cs.CL", "cat:cs.NE", "cat:stat.ML"]
        if len(cats) == 0:
            cats = ""
        else:
            cats = "+OR+".join(["cat:cs.CV", "cat:cs.AI", "cat:cs.LG", "cat:cs.CL", "cat:cs.NE", "cat:stat.ML"])
            cats = "%%28%s%%29+AND+" % cats

        q = "http://export.arxiv.org/api/query?search_query=%s%%28au:+%s+OR+ti:+%s%%29&start=0&max_results=25"
        q = q % (cats, self.q, self.q)
        logger.info("query url is  %s" % q)
        response = urllib2.urlopen(q).read()
        feed = feedparser.parse(response)
        found_papers = []

        logger.info("arxiv returns %i entries" % len(feed.entries))
        for entry in feed.entries:
            paper = parse_arxiv_entry(entry)
            found_papers.append(paper)

        logger.info("analyzed %i papers" % len(found_papers))
        return found_papers


class FetchHandler(base.FetchHandler):
    def _create_url(self, arg):
        return "http://export.arxiv.org/api/query?search_query=id:+%s&start=0&max_results=25" % arg

    def _parse(self, response):
        try:
            feed = feedparser.parse(response)
            print feed.entries
            entry = feed.entries[0]
            paper = parse_arxiv_entry(entry)
            paper['search_scope'] = "arxiv"
            remote_pdf = "http://arxiv.org/pdf/%s.pdf" % paper['id']
            return paper['id'], remote_pdf, paper
        except Exception as e:
            logger.warn(e)
            return "", "", []
