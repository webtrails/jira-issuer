/** @jsx React.DOM */

'use strict';

var Layout = require('./layout.jsx');
var React = require('react');
var ReactDOM = require('react-dom');
var _ = require('lodash');

module.exports = React.createClass({

  getInitialState: function () {
    return {
      data: {}
    };
  },

  render: function () {
    return (
      <Layout {...this.props}>
        <div id="index" className="row-fluid">
          <h1>{this.props.data}</h1>
        </div>
      </Layout>
    );
  }

});
