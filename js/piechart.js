var transactionsChart = {

    created: false,

    updating: false,

    // Sum for selected sector
    totalSum: 0,

    width: 1000,

    height: 640,

    radius: function () {
        return Math.min(this.width, this.height) / 2.65;
    },

    animationDuration: 750,

    // Category labels size
    iconSize: 25,

    // Transaction indicators color
    colorIndicatorSize: 15,

    centerCircleGroup: {},

    centerCircle: {},

    totalLabelGroup: {},

    totalInfoLabel: {},

    totalLabel: {},

    backLabelGroup: {},

    svgElement: {},

    infoBoard: {},

    switchToCreated: function () {
        this.created = true;
    },

    /**
     * Function. Takes and process
     * data to pie chart format.
     * Inits in a while.
     *
     * @params data(Array)
     */
    getPieData: {},

    /**
     * Function. Creates "svg:path"'s d attribute with specified data.
     * Inits in a while.
     *
     * @params pieData(Array)
     */
    arc: {},

    /**
     * Ghost arc uses for creating info
     * line indicators
     *
     */
    ghostArc: {},

    /**
     * Function. Returns color with specified index
     *
     * @params index(int)
     */
    colorScale: {},

    // Info lines, shows categories
    polylineGroup: {},

    polylines: [],

    polylineSectorLength: 15,

    labels: [],

    changeTotalInfoLabelText: function (text) {
        if (text.length < 16) this.totalInfoLabel.text(text);
        else this.totalInfoLabel.text([text.substr(0, 15), '...'].join(''));
    },

    /**
     * Use this function to create position of the specified
     * label element on the svg canvas
     *
     * @param d
     * @param i
     * @param condition
     * @param subtract
     * @returns coordinates(Array)
     */
    getCorrectVector: function (options) {

        var subtraction = options.subtract || 0,
            iconSize = 0,
            offsetWidth = options.offset || 0,
            condition = options.condition || undefined,
            padding = 0;

        if (subtraction > 0) {
            padding = 5;
        }

        if ( condition && (condition === 'image') ) {
            iconSize = this.iconSize;
        } else if (condition && (condition === 'color-indicator')) {
            iconSize = this.colorIndicatorSize;
        }

        return (options.val < 0) ?
        options.val - this.polylineSectorLength - iconSize - offsetWidth - padding :
        options.val + this.polylineSectorLength + subtraction + padding;

    },

    /**
     * Generates the polylines 'points' attribute
     *
     * @param d
     * @returns {string}
     */
    generatePoints: function (d) {

        var xAxisPoint = this.ghostArc.centroid(d)[0];

        return [
            this.arc.centroid(d).join(','),
            this.ghostArc.centroid(d).join(','),
            (
                this.getCorrectVector.call(this, {val: xAxisPoint}) +
                ',' +
                this.ghostArc.centroid(d)[1]
            )
        ].join(' ');
    },


    generatePosition: function (options) {

        var xAxisPoint = this.ghostArc.centroid(options.data)[0],
            subtraction = options.subtract || 0,
            offsetWidth = options.textNodeWidthsArray[options.counter];

        if (options.condition === 'image') {

            // console.log('This is subtraction for image: ', subtraction, offsetWidth);

            return [
                this.getCorrectVector.call(this, {
                    val: xAxisPoint,
                    subtract: subtraction,
                    offset: offsetWidth,
                    condition: options.condition
                }),
                this.ghostArc.centroid(options.data)[1] - this.iconSize / 1.5
            ];
        } else if (options.condition === 'color-indicator') {
            return [
                this.getCorrectVector.call(this, {
                    val: xAxisPoint,
                    subtract: subtraction,
                    offset: offsetWidth,
                    condition: options.condition
                }),
                this.ghostArc.centroid(options.data)[1] - this.colorIndicatorSize / 1.25
            ];
        } else if (options.condition === 'text') {
            var x = this.getCorrectVector.call(this, {val: xAxisPoint}) < 0 ?
            this.getCorrectVector.call(this, {val: xAxisPoint}) - options.element.getBBox().width :
                this.getCorrectVector.call(this, {val: xAxisPoint});
            return [
                x,
                this.ghostArc.centroid(options.data)[1]
            ];
        } else {
            return [
                this.getCorrectVector.call(this, {val: xAxisPoint}),
                this.ghostArc.centroid(options.data)[1]
            ];
        }

    },

    arcGroup: {},

    paths: {},

    depthData: {},

    depthLevel: 0,

    categoryColorPalette: {
        "Travel_and_Holiday": "#A4CF37",
        "Food_and_Restorants": "#FFAE00",
        "Health": "#FF5240",
        "Gifts": "#FFD51E",
        "Entertainment": "#6A38C8",
        "Accounts_and_Others": "#004986",
        "Business_Services": "#007B78",
        "Car": "#07C1F6",
        "Children": "#FF8CC7",
        "Education": "#00CFC8",
        "Fees": "#006CC9",
        "Finance_and_Investments": "#93918F",
        "House": "#A2003D",
        "Other": "#C7C7C7",
        "Personal_Care": "#AC4FBA",
        "Pets": "#72563B",
        "Shopping": "#00AF32",
        "Cash_Transactions": "#A5D6A7",
        "Transfers": "#A723C7",
        "No_Category": "#D4F1EC"

    },

    initSvgElement: function () {

        this.svgElement = d3.select('.transactions-chart').append('svg')
            .attr('width', this.width)
            .attr('height', this.height)
            .on('mousemove', handleMouseMove);

        var self = this;

        function handleMouseMove (e) {
            var coordinates = d3.mouse(this);
            self.infoBoardGroup.attr('transform', ['translate', '(', coordinates[0] + 10, ',', coordinates[1] - 10, ')'].join(''));
        }

    },

    initInfoBoard: function () {
        this.infoBoardGroup = this.svgElement.append('g')
            .attr('display', 'none')
            .attr('class', 'info-board-group');


        this.infoBoardFilter = this.infoBoardGroup.append('defs')
            .append('filter')
            .attr({
                'xmlns': 'http://www.w3.org/2000/svg',
                'id': 'f3',
                'filterUnits': 'userSpaceOnUse',
                'color-interpolation-filters': 'linearRGB'
            });

        var filterGr = this.infoBoardFilter.append('feComponentTransfer')
            .attr('in', 'SourceAlpha');

        filterGr.append('feFuncR').attr('type', 'discrete').attr('tableValues', '0.3');
        filterGr.append('feFuncG').attr('type', 'discrete').attr('tableValues', '0.3');
        filterGr.append('feFuncB').attr('type', 'discrete').attr('tableValues', '0.3');

        this.infoBoardFilter.append('feGaussianBlur').attr('stdDeviation', '2');
        this.infoBoardFilter.append('feOffset').attr({'dx': '2', 'dy': '2', 'result': 'shadow'});
        this.infoBoardFilter.append('feComposite').attr({'in': 'SourceGraphic', 'in2': 'shadow', 'operator': 'over'});

        this.infoBoard = this.infoBoardGroup.append('rect')
            .attr('class', 'info-board')
            .attr('width', '100')
            .attr('height', '40')
            .attr('rx', '1')
            .attr('ry', '1')
            .attr('fill', '#ffffff')
            .attr('fill-opacity', '0.62')
            .attr('x', '0')
            .attr('y', '0')
            .attr('filter', 'url(#f3)');

        this.infoBoardIcon = this.infoBoardGroup.append('image')
            .attr('class', 'info-board-icon')
            .attr('xlink:href', null)
            .attr('width', this.iconSize / 1.5)
            .attr('height', this.iconSize / 1.5)
            .attr('x', '10')
            .attr('y', '5');

        this.infoBoardCategory = this.infoBoardGroup.append('text')
            .attr('class', 'info-board-category')
            .attr('x', this.iconSize / 1.5 + 15)
            .attr('y', 18);

        this.infoBoardSum = this.infoBoardGroup.append('text')
            .attr('class', 'info-board-category')
            .attr('x', 50)
            .attr('y', '35');
    },

    setInfoBoardData: function (options) {
        this.infoBoardIcon.attr('xlink:href', options.href);
        this.infoBoardCategory.text(options.text);
        this.infoBoardSum.text(options.sum);
    },

    initPieData: function () {

        console.log(d3, d3.layout);

        this.getPieData = d3.layout.pie().value(setValueData).sort(null);

        function setValueData (d) {
            return d.sum || d.amount || 0;
        }

    },

    initArc: function () {

        this.arc = d3.svg.arc()
            .innerRadius(this.radius() - 85)
            .outerRadius(this.radius() - 30);

    },

    /**
     * Ghost arc uses to create
     * label's polyline
     *
     */
    initGhostArc: function () {
        this.ghostArc = d3.svg.arc()
            .innerRadius(this.radius())
            .outerRadius(this.radius());
    },

    initAllLabelsGroup: function () {

        var self = this;

        this.polylineGroup = this.svgElement.append('g')
            .attr('class', 'all-labels-group')
            .attr('transform', createTransformValue);

        function createTransformValue () {
            return "translate(" + self.width / 2 +  "," + self.height / 2 +  ")";
        }
    },

    initColorScale: function () {
        this.colorScale = d3.scale.category20();
    },

    initArcGroup: function () {

        var self = this;

        this.arcGroup = this.svgElement
            .append('g')
            .attr('class', 'all-arcs-group')
            .attr('transform', createTransformValue);

        function createTransformValue () {
            return "translate(" + self.width / 2 +  "," + self.height / 2 +  ")";
        }
    },

    initCenterCircleGroup: function () {

        var self = this;

        this.centerCircleGroup = this.svgElement
            .append('g')
            .attr('class', 'center-circle-group')
            .attr('transform', createTransformValue);

        function createTransformValue () {
            return "translate(" + self.width / 2 +  "," + self.height / 2 +  ")";
        }
    },

    initCenterCircle: function () {
        this.centerCircle = this.centerCircleGroup
            .append('circle')
            .attr('fill', '#fff')
            .attr('class', 'center-circle')
            .attr('r', this.radius() - 85)
            .on('mouseover', handleMouseOver)
            .on('mouseleave', handleMouseLeave)
            .on('click', handleClick);

        function handleMouseOver () {
            if (transactionsChart.depthLevel > 0) {
                $(this).css({
                    'transform': 'scale(0.96)',
                    'cursor': 'pointer'
                });
            }
        }

        function handleMouseLeave () {
            $(this).css({
                'transform': 'scale(1)',
                'cursor': 'default'
            });
        }

        function handleClick () {
            $(this).css({
                'transform': 'scale(1)',
                'cursor': 'default'
            });

            if (transactionsChart.getCurrentDepthData()) {

                transactionsChart.updateChart(transactionsChart.getCurrentDepthData());
                transactionsChart.removeCurrentDepthData();
                transactionsChart.changeDepthLevel(-1);
                transactionsChart.toggleBackLabelGroup();

                if (transactionsChart.depthData[transactionsChart.depthLevel]) {
                    transactionsChart
                        .changeTotalInfoLabelText(transactionsChart.depthData[transactionsChart.depthLevel]['category_info'].name);
                    transactionsChart
                        .writeTotalSum(transactionsChart.depthData[transactionsChart.depthLevel]['category_info'].sum);
                } else {
                    transactionsChart.changeTotalInfoLabelText('Total Amount');
                    transactionsChart.writeTotalSum(transactionsChart.totalSum);
                }

            }
        }
    },

    initTotalLabelGroup: function () {
        this.totalLabelGroup = this.centerCircleGroup
            .append('g')
            .attr('class', 'total-label-group');
    },

    initTotalLabel: function () {

        this.totalLabel = this.totalLabelGroup
            .append('text')
            .attr('dy', -20)
            .attr('class', 'total-label')
            .attr('text-anchor', 'middle')
            .text('0€');

    },

    initTotalInfoLabel: function () {
        this.totalInfoLabel = this.totalLabelGroup.append('text')
            .attr('dy', 30)
            .attr('class', 'total-label-info')
            .attr('text-anchor', 'middle')
            .text('Total Amount')
    },

    initBackLabel: function () {

        this.backLabelGroup = this.totalLabelGroup.append('g')
            .attr('display', 'none')
            .attr('class', 'back-label-group')
            .attr('transform', 'translate(0, 75)')
            .on('mouseover', handleMouseOver)
            .on('mouseleave', handleMouseLeave)
            .on('click', handleClick);

        this.backLabelGroup.append('text')
            .attr('class', 'back-label')
            .attr('text-anchor', 'middle')
            .text('Back');

        this.backLabelGroup.append('text')
            .attr('dx', -35)
            .attr('class', 'back-angle')
            .text('<');

        function handleMouseOver () {
            $(this).find('.back-angle').attr('transform', 'translate(-5, 0)');
        }

        function handleMouseLeave () {
            $(this).find('.back-angle').attr('transform', 'translate(0, 0)');
        }

        function handleClick () {
            if (transactionsChart.getCurrentDepthData()) {

                transactionsChart.updateChart(transactionsChart.getCurrentDepthData());
                transactionsChart.removeCurrentDepthData();
                transactionsChart.changeDepthLevel(-1);
                transactionsChart.toggleBackLabelGroup();

                if (transactionsChart.depthData[transactionsChart.depthLevel]) {
                    transactionsChart
                        .changeTotalInfoLabelText(transactionsChart.depthData[transactionsChart.depthLevel]['category_info'].name);
                    transactionsChart
                        .writeTotalSum(transactionsChart.depthData[transactionsChart.depthLevel]['category_info'].sum);
                } else {
                    transactionsChart.changeTotalInfoLabelText('Total Amount');
                    transactionsChart.writeTotalSum(transactionsChart.totalSum);
                }
            }
        }

    },

    /**
     * Animation Function. Context this, refers to arc object,
     * because of d3 promise object, where
     * function calls
     *
     */
    arcTween: function (d) {
        var i,
            self = transactionsChart;

        if (!this.current_) {

            /**
             * Placeholder object to create animation
             * for new arcs, that have no previous state
             *
             */
            this.current_ = {
                data: {sum: 0, title: ''},
                value: 1,
                startAngle: 0,
                endAngle: 0.41887902047863906,
                padAngle: 0
            };

        }

        i = d3.interpolate(this.current_, d);

        this.current_ = i(0);

        return function (t) {
            return self.arc(i(t));
        };
    },

    getCurrentDepthData: function () {
        return this.depthData[this.depthLevel].datum;
    },

    changeDepthLevel: function (level) {
        this.depthLevel += level;
    },

    createDataDepthLevel: function (options) {

        this.depthData[this.depthLevel] || (this.depthData[this.depthLevel] = {});

        this.depthData[this.depthLevel].datum = this.paths.data().map(function (item) {
            return item.data;
        });

        this.depthData[this.depthLevel].category_info = {
            name: options.catName,
            sum: options.catSum
        };

    },

    removeCurrentDepthData: function () {
        delete this.depthData[this.depthLevel];
    },

    calculateTotalSum: function (data) {

        var self = this;

        data.forEach(iterate);

        function iterate (item, i) {
            var sum = window.parseFloat(item.sum || item.amount || 0);
            if (sum) {
                self.totalSum += sum;
            }
        }
    },

    writeTotalSum: function (val) {
        var formattedValue = window.parseFloat( val.toFixed(2) );
        this.totalLabel.text([formattedValue, '€'].join(''));
    },

    resetTotalSum: function () {
        this.totalSum = 0;
    },

    toggleBackLabelGroup: function () {

        var self = this;

        this.backLabelGroup
            .attr('display', generateDisplayAttribute);

        function generateDisplayAttribute () {
            return (self.depthLevel === 0) ? 'none' : null;
        }
    },

    hideLabels: function () {
        this.labels.attr('display', 'none');
    },

    updateChart: function (newData, resetDepthData) {

        if (resetDepthData) {
            this.depthLevel = 0;
        }

        d3.selectAll('.label-group').attr('display', null);

        var self = this,
            textNodeWidths = [];

        this.resetTotalSum();
        this.calculateTotalSum(newData);
        this.writeTotalSum(this.totalSum);

        if (this.totalSum === 0) {
            transactionsChart.changeTotalInfoLabelText('No transactions');
        }

        this.updating = true;

        // Update Data
        if (this.created) {
            this.paths = this.paths.data(this.getPieData(newData));
            this.labels = this.labels.data(this.getPieData(newData));

            // Update Exit

            this.paths.exit().remove();
            this.labels.exit().remove();

            // Update Enter
            this.paths
                .attr('fill', reinitArcsFill)
                .on('mouseover', handlePathMouseOver)
                .on('mouseleave', handlePathMouseLeave)
                .on('click', handlePathClick);

            this.paths.enter().append('path')
                .attr('class', 'data-arc')
                .attr('fill', reinitArcsFill)
                .on('mouseover', handlePathMouseOver)
                .on('mouseleave', handlePathMouseLeave)
                .on('click', handlePathClick);

            this.paths.transition().duration(this.animationDuration).attrTween("d", this.arcTween);

            // console.log(this.labels, 'This are all lables yet');
            // console.log(this.labels.enter(), 'This are all unrendered yet labels');

            this.labels.enter().append('g')
                .attr('class', 'label-group');

        } else {
            // Create Data
            this.paths = this.arcGroup.selectAll('path')
                .data(this.getPieData(newData)).enter().append('path')
                .attr('class', 'data-arc')
                .attr('fill', reinitArcsFill)
                .attr('d', generateArcDAttribute)
                .on('mouseover', handlePathMouseOver)
                .on('mouseleave', handlePathMouseLeave)
                .on('click', handlePathClick)
                .each(createPropertyForTweenAnimation);

            this.labels = this.polylineGroup.selectAll('g').data(this.getPieData(newData)).enter().append('g')
                .attr('class', 'label-group');
        }

        d3.selectAll('polyline.label-line').remove();
        d3.selectAll('text.label-text').remove();
        d3.selectAll('image.label-icon').remove();
        d3.selectAll('rect.color-indicator').remove();

        this.labels.append('polyline')
            .attr('class', 'label-line')
            .attr('fill', 'transparent')
            .attr('stroke', '#B4B4B4')
            .attr('stroke-width', 1)
            .attr('points', this.generatePoints.bind(this));


        this.labels.append('text')
            .attr('class', 'label-text')
            .text(generateLabelText)
            .attr('transform', generateLabelTextTransform)
            .on('mouseover', handleLabelIconAndTextMouseOver)
            .on('mouseleave', handleLabelIconAndTextMouseLeave)
            .on('click', handleLabelIconAndTextClick);


        this.labels.append('image')
            .attr('class', 'label-icon')
            .attr('display', generateLabelIconDisplayAttribute)
            .attr('xlink:href', generateIconHref)
            .attr('width', this.iconSize)
            .attr('height', this.iconSize)
            .attr('transform', generateIconTransformAttribute.bind(this))
            .on('mouseover', handleLabelIconAndTextMouseOver)
            .on('mouseleave', handleLabelIconAndTextMouseLeave)
            .on('click', handleLabelIconAndTextClick);

        this.labels.append('rect')
            .attr('display', generateColorIndicatorDisplayAttribute)
            .attr('class', 'color-indicator')
            .attr('width', this.colorIndicatorSize)
            .attr('height', this.colorIndicatorSize)
            .attr('rx', '5')
            .attr('ry', 5)
            .attr('fill', generateColorIdicatorColor)
            .attr('transform', generateColorIndicatorTransformAttribute.bind(this));

        this.backLabelGroup
            .attr( 'display', (this.depthLevel ? 'block' : 'none') );

        this.switchToCreated();

        window.setTimeout(this.hideLabels.bind(this), 20);

        window.setTimeout(function () {
            self.updating = false;
        }, this.animationDuration);

        function reinitArcsFill (d, i) {
            return d.data.color || d.data.color_cat;
            /*if (!d.data.icon) return self.colorScale(i);
             return self.categoryColorPalette[d.data.icon];*/
        }

        function generateLabelText (d) {

            if (!d.data.name && d.data.data_time_done && d.data.amount) {

                var spaceIndex = d.data.data_time_done.indexOf(' ')
                formatedDate = d.data.data_time_done.substr(0, spaceIndex);

                return formatedDate + ' ' + d.data.amount + '€';
            }

            var currentNodeSumPercentage = ( (d.data.sum || d.data.amount || 0) / self.totalSum * 100).toFixed(1) + '%';

            return d.data.name && (d.data.name.length < 15) ?
                [d.data.name, ' ', currentNodeSumPercentage].join('') :
                [
                    [ (d.data.name || 'No title').substr(0, 14), '...'].join(''),
                    ' ',
                    currentNodeSumPercentage
                ].join('');
        }

        function generateArcDAttribute (d) {
            return self.arc(d);
        }

        function createPropertyForTweenAnimation (d) {
            this.current_ = d;
        }

        function generateLabelTextTransform (d, i) {
            // console.log('Generating label text transform here. The label is: ', this);
            // console.log(Object.keys(this), 'this is bounfing client function');

            textNodeWidths.push( window.parseFloat(this.getBBox().width) );

            var labelText = this;

            return 'translate(' + self.generatePosition.call(self, {
                    data: d,
                    counter: i,
                    condition: 'text',
                    textNodeWidthsArray: textNodeWidths,
                    element: labelText
                }) + ')';

        }

        function generateLabelIconDisplayAttribute (d) {
            return (d.data.data_time_done) ? 'none' : null;
        }

        function generateIconHref (d, i) {
            if (!d.data.icon && !d.data.icon_cat) console.log('Category icon was not found.');

            if (!d.data.icon) {
                return "images/" + d.data.icon_subcat + '.png';
            }
            else {
                return "images/" + d.data.icon + '.png';
            }
        }

        function generateIconTransformAttribute (d, i) {

            //console.log('Generating position for one of the images here.');
            //console.log('Here is subtract for one of the images: ', textNodeWidths, textNodeWidths[i]);

            return 'translate(' + this.generatePosition.call(this, {
                    data: d,
                    counter: i,
                    condition: 'image',
                    textNodeWidthsArray: textNodeWidths,
                    subtract: textNodeWidths[i]
                }) + ')';

        }

        function generateColorIndicatorDisplayAttribute (d) {
            return (!d.data.data_time_done) ? 'none' : null;
        }

        function generateColorIdicatorColor (d, i) {
            return self.colorScale(i);
        }

        function generateColorIndicatorTransformAttribute (d, i) {
            return 'translate(' + this.generatePosition.call(this, {
                    data: d,
                    counter: i,
                    condition: 'color-indicator',
                    textNodeWidthsArray: textNodeWidths,
                    subtract: textNodeWidths[i]
                }) + ')';
        }

        function handlePathMouseOver (d, i) {

            var index = i,
                childrenData = this.__data__.data.children,
                currentNodeSumPercentage = ( (d.data.sum || d.data.amount || 0) / self.totalSum * 100).toFixed(1) + '%';

            if (childrenData) {
                ui.setPathNode(this, 'active');
            }

            self.setInfoBoardData({
                href: generateIconHref(d),
                text: d.data.name
                    ?
                    d.data.name.length < 9
                        ?
                        d.data.name
                        :
                        [d.data.name.substr(0, 6), '...'].join('')
                    :
                    d.data.name_subcat.length < 9
                        ?
                        d.data.name_subcat
                        :
                        [d.data.name_subcat.substr(0, 6), '...'].join(''),
                sum: currentNodeSumPercentage
            });

            self.infoBoardGroup.attr('display', null);

            if (!self.updating) {
                d3.selectAll('.label-group').attr('display', 'none');
                d3.selectAll('.label-group').filter(function (d, i) { return i === index; }).attr('display', null);
            }

            showCategoryInfoMouseOver(d);

        }

        function handleLabelIconAndTextMouseOver (d, i) {

            var path = d3.selectAll('path').filter(function (data, index) {
                    return index === i;
                }),
                pathDOMElement = path[0][0],
                isPathHasChildren = pathDOMElement.__data__.data.children;

            if (isPathHasChildren) {
                ui.setPathNode(pathDOMElement, 'active');
            }

            showCategoryInfoMouseOver(d);

        }

        function showCategoryInfoMouseOver (datum) {
            if (datum.data.name) {
                self.changeTotalInfoLabelText(datum.data.name);
            } else {
                self.changeTotalInfoLabelText(datum.data.name_subcat);
            }
            self.writeTotalSum(datum.data.sum || datum.data.amount || 0);
        }

        function handlePathMouseLeave () {

            ui.setPathNode(this, 'inactive');

            showCategoryInfoMouseLeave();

            self.infoBoardGroup.attr('display', 'none');

            d3.selectAll('.label-group').attr('display', 'none');

        }

        function handleLabelIconAndTextMouseLeave () {
            d3.selectAll('path').each(handleInactiveState);

            showCategoryInfoMouseLeave();

            function handleInactiveState () {
                ui.setPathNode(this, 'inactive');
            }
        }

        function showCategoryInfoMouseLeave () {
            if (self.depthData[self.depthLevel]) {
                self.changeTotalInfoLabelText(self.depthData[self.depthLevel]['category_info'].name);
                self.writeTotalSum(self.depthData[self.depthLevel]['category_info'].sum);
            } else {
                self.changeTotalInfoLabelText('Total Amount');
                self.writeTotalSum(self.totalSum);
            }
        }

        function handlePathClick () {
            var nodeData = this.__data__.data,
                childrenData = nodeData.children;

            ui.setPathNode(this, 'inactive');

            d3.selectAll('.label-group').attr('display', null);

            if (childrenData) {
                transactionsChart.changeDepthLevel(1);
                transactionsChart.toggleBackLabelGroup();
                transactionsChart.resetTotalSum(0);
                transactionsChart.createDataDepthLevel({catName: nodeData.name, catSum: nodeData.sum});
                transactionsChart.updateChart(childrenData);
            }

        }

        function handleLabelIconAndTextClick (d, i) {
            var nodeData = this.__data__.data,
                childrenData = nodeData.children;

            d3.selectAll('.label-group').attr('display', null);
            d3.selectAll('path').each(handleInactiveState);


            if (childrenData) {
                transactionsChart.changeDepthLevel(1);
                transactionsChart.toggleBackLabelGroup();
                transactionsChart.resetTotalSum(0);
                transactionsChart.createDataDepthLevel({catName: nodeData.name, catSum: nodeData.sum});
                transactionsChart.updateChart(childrenData);
            }

            function handleInactiveState () {
                ui.setPathNode(this, 'inactive');
            }
        }

    },

    /**
     * Init Chart
     *
     */
    create: function (data) {
        this.initSvgElement();
        this.initPieData();
        this.initArc();
        this.initGhostArc();
        this.initAllLabelsGroup();
        this.initColorScale();
        this.initArcGroup();
        this.initCenterCircleGroup();
        this.initCenterCircle();
        this.initTotalLabelGroup();
        this.initTotalInfoLabel();
        this.initTotalLabel();
        this.initBackLabel();
        this.initInfoBoard();
        this.calculateTotalSum(data);
        this.writeTotalSum(this.totalSum);
        this.updateChart(data);
    }

};