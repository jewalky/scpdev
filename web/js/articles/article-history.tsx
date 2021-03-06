import * as React from 'react';
import { Component } from 'react';
import {ArticleLogEntry, fetchArticleLog} from "../api/articles";
import WikidotModal from "../util/wikidot-modal";
import sleep from "../util/async-sleep";
import styled from "styled-components";
import Loader from "../util/loader";
import formatDate from "../util/date-format";


interface Props {
    pageId: string
    onClose: () => void
}


interface State {
    loading: boolean
    entries?: Array<ArticleLogEntry>
    entryCount: number
    page: number
    nextPage?: number
    perPage: number
    error?: string
    fatalError?: boolean
}


const Styles = styled.div<{loading?: boolean}>`
#revision-list.loading {
  position: relative;
  min-height: calc(32px + 16px + 16px);
  &::after {
    content: ' ';
    position: absolute;
    background: #0000003f;
    z-index: 0;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
  }
  .loader {
    position: absolute;
    left: 16px;
    top: 16px;
    z-index: 1;
  }
}
.page-history {
  tr td {
    &:nth-child(2) {
      width: 5em;
    }
    &:nth-child(4) {
      width: 5em;
    }
    &:nth-child(5) {
      width: 15em;
    }
    &:nth-child(6) {
      padding: 0 0.5em;
      width: 12em;
    }
    &:nth-child(7) {
      font-size: 90%;
    }
  }
}
`;


class ArticleHistory extends Component<Props, State> {

    constructor(props) {
        super(props);
        this.state = {
            loading: false,
            entries: null,
            entryCount: 0,
            page: 1,
            perPage: 25
        };
    }

    componentDidMount() {
        this.loadHistory();
    }

    async loadHistory() {
        const { pageId } = this.props;
        const { page, perPage, entries } = this.state;
        this.setState({ loading: true, error: null });
        try {
            const realPage = page;
            const from = (realPage-1) * perPage;
            const to = (realPage) * perPage;
            const history = await fetchArticleLog(pageId, from, to);
            this.setState({ loading: false, error: null, entries: history.entries, entryCount: history.count });
        } catch (e) {
            this.setState({ loading: false, fatalError: entries === null, error: e.error || '???????????? ?????????? ?? ????????????????' });
        }
    }

    onClose = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (this.props.onClose)
            this.props.onClose();
    };

    onCloseError = () => {
        const { fatalError } = this.state;
        this.setState({error: null});
        if (fatalError) {
            this.onClose(null);
        }
    };

    render() {
        const { error, entries, loading } = this.state;
        return (
            <Styles>
                { error && (
                    <WikidotModal buttons={[{title: '??????????????', onClick: this.onCloseError}]}>
                        <strong>????????????:</strong> {error}
                    </WikidotModal>
                ) }
                <a className="action-area-close btn btn-danger" href="#" onClick={this.onClose}>??????????????</a>
                <h1>?????????????? ??????????????????</h1>
                <div id="revision-list" className={`${loading?'loading':''}`}>
                    { loading && <Loader className="loader" /> }
                    { entries && (
                        <table className="page-history">
                            <tbody>
                            <tr>
                                <td>??????.</td>
                                <td>&nbsp;</td>
                                <td>??????????</td>
                                <td>????????????????</td>
                                <td>????</td>
                                <td>????????</td>
                                <td>??????????????????????</td>
                            </tr>
                            { entries.map(entry => {
                                return (
                                    <tr key={entry.revNumber}>
                                        <td>
                                            {entry.revNumber}.
                                        </td>
                                        <td>&nbsp;</td>
                                        <td>
                                            {this.renderFlags(entry)}
                                        </td>
                                        <td>&nbsp;</td>
                                        <td>n/a</td>
                                        <td>
                                            {this.renderDate(entry)}
                                        </td>
                                        <td>
                                            {this.renderComment(entry)}
                                        </td>
                                    </tr>
                                )
                            }) }
                            </tbody>
                        </table>
                    ) }
                </div>
            </Styles>
        )
    }

    renderFlags(entry: ArticleLogEntry) {
        switch (entry.type) {
            case 'new':
                return <span className="spantip" title="?????????????? ?????????? ????????????????">N</span>;

            case 'title':
                return <span className="spantip" title="?????????????????? ??????????????????">T</span>;

            case 'source':
                return <span className="spantip" title="?????????????????? ?????????? ????????????">S</span>;

            case 'name':
                return <span className="spantip" title="???????????????? ??????????????????????????/??????????????">R</span>;
        }
    }

    renderDate(entry: ArticleLogEntry) {
        return formatDate(new Date(entry.createdAt));
    }

    renderComment(entry: ArticleLogEntry) {
        if (entry.comment.trim()) {
            return entry.comment;
        }
        switch (entry.type) {
            case 'new':
                return '???????????????? ?????????? ????????????????';

            case 'title':
                return <>?????????????????? ?????????????? ?? "<em>{entry.meta.prev_title}</em>" ???? "<em>{entry.meta.title}</em>"</>;

            case 'name':
                return <>???????????????? ?????????????????????????? ???? "<em>{entry.meta.prev_name}</em>" ?? "<em>{entry.meta.name}</em>"</>;
        }
    }

}


export default ArticleHistory