class Query(object):
    def download(self, target):
        raise NotImplementedError

    def query(self, q):
        raise NotImplementedError


# class ArxivQuery(Query):
#     def __init__(self):
#         super(ArxivQuery, self).__init__()
#         self.root_url = 'http://export.arxiv.org/api/'

class GoogleScholarQuery(Query):
    """docstring for GoogleScholarQuery"""
    def __init__(self):
        super(GoogleScholarQuery, self).__init__()
        self.root_url = "https://scholar.google.de/scholar?hl=de&q=Deblurring&btnG=&lr="

    def query(self, q):
        pass
