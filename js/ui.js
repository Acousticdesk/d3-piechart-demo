var ui = {

    setPathNode: function (el, condition) {

        if (condition === 'active') {
            $(el).css({
                transform: 'scale(1.05)',
                cursor: 'pointer'
            });
        } else if (condition === 'inactive') {
            $(el).css({
                transform: 'scale(1)',
                cursor: 'default'
            });
        }

    }

};