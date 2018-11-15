this["Fliplet"] = this["Fliplet"] || {};
this["Fliplet"]["Widget"] = this["Fliplet"]["Widget"] || {};
this["Fliplet"]["Widget"]["Templates"] = this["Fliplet"]["Widget"]["Templates"] || {};

this["Fliplet"]["Widget"]["Templates"]["templates.interface.active-user"] = Handlebars.template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    return "{{#each this}}\n  <div class=\"analytics-row\">\n    <div class=\"analytics-row-name\">\n      <p>{{userEmail}}</p>\n    </div>\n    <div class=\"analytics-row-score\">\n      <p>{{ count }}</p>\n    </div>\n  </div>\n{{/each}}";
},"useData":true});

this["Fliplet"]["Widget"]["Templates"]["templates.interface.app-metrics"] = Handlebars.template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    return "{{#each this}}\n  <div class=\"analytics-row\">    \n    <span class=\"analytics-box-text-span\">{{[Title]}}</span>\n    <span class=\"analytics-box-number-prior\" id=\"metric-active-users-prior\">{{[Prior period]}}</span>\n    <span class=\"analytics-box-number\" id=\"metric-active-users\">{{[Selected period]}}</span>\n  </div>\n{{/each}}";
},"useData":true});

this["Fliplet"]["Widget"]["Templates"]["templates.interface.popular-screen"] = Handlebars.template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    return "{{#each this}}\n  <div class=\"analytics-row\">\n    <div class=\"analytics-row-name\">\n      <p>{{ _pageTitle }}</p>\n    </div>\n    <div class=\"analytics-row-score\">\n      <p>{{#if sessionsCount}}{{sessionsCount}}{{else}}{{ count }}{{/if}}</p>\n    </div>\n  </div>\n{{/each}}";
},"useData":true});