import connection from '../config/database';

export const getFoods = (req, res) => {
    let filtersQuery = '';
    let categoriesQuery = '';
    console.log('??????=====================>', req.body.req_filters);
    if(req.body.req_filters.length ===1 && req.body.req_filters[0] === '') {
        filtersQuery = " where f.description like '-1'";
    } else {
        filtersQuery = ' where ';
        let st = 0;
        req.body.req_filters.forEach(function (filter) {
            if(st) {
                filtersQuery += ' and ';
            }
            filtersQuery += `f.description like '%${filter}%'`;
            st = 1;
        });
    }

    if(req.body.req_categories.length !== 0) {
        categoriesQuery = ' and f.food_category_id in (';
        let st = 0;
        req.body.req_categories.forEach(function (category) {
            if(st) {
                categoriesQuery += ', ';
            }
            categoriesQuery += category;
            st = 1;
        });
        categoriesQuery += ')';
    }

    const query = `select f.fdc_id, f.description, fc.id, fc.descr from food f join food_category fc on fc.id=f.food_category_id` + filtersQuery + categoriesQuery + ' order by f.description limit 50';
    // res.send(query);
    connection.query(query, function (error, results, fields) {
        if (error) throw error;
        res.send(results);
    });
};

export const getNutrients = (req, res) => {
    let filtersValue = '';
    if(req.body.req_filters.length ===1 && req.body.req_filters[0] === '') {
        filtersValue = "-1";
    } else {
        filtersValue = req.body.req_filters;
    }
    const query = `select id, name, lower(unit_name) unit_name, dri_amount, type from nutrient where name like '%${filtersValue}%' order by name limit 50`;
    // res.send(query);
    connection.query(query, function (error, results, fields) {
        if (error) throw error;
        res.send(results);
    });
};

export const getCategories = (req, res) => {
    connection.query(`select id, descr from food_category where id in (3, 18, 13, 14, 8, 20, 1, 21, 4, 15, 9, 17, 16, 22, 12, 10, 5, 25, 7, 23, 6, 2, 19, 11) order by descr`, function (error, results, fields) {
        if (error) throw error;
        res.send(results);
    });

};

export const getUserTimeByUserId = (req, res) => {
    let {id} = req.params;
    connection.query(`select id, TIME_FORMAT(item_time, '%h:%i %p') item_time, name from user_time where user_id='${id}' order by DATE_FORMAT(item_time, '%H:%i:%s')`, function (error, results) {
        if (error) throw error;
        res.send(results);
    });
};

export const getFoodNutrientInfoByFoodId = (req, res) => {
    let {id} = req.params;
    connection.query(`select n.id, n.name, n.unit_name from nutrient n join (select nutrient_id from food_nutrient where fdc_id=${id}) current_food_nutrients on n.id=current_food_nutrients.nutrient_id`, function (error, results) {
        if (error) throw error;
        res.send(results);
    });
};

export const getFoodPortionInfoByFoodId = (req, res) => {
    let {id} = req.params;
    connection.query(`select id, amount, modifier, gram_weight from food_portion where fdc_id=${id}`, function (error, results) {
        if (error) throw error;
        res.send(results);
    });
};

export const getMainData = (req, res) => {
    connection.query(`select min(day_id_amounts) status from (select count(day_id) day_id_amounts from user_item group by day_id) status_table`, function (error, results) {
        if (error) throw error;
        res.send(results);
    });
};

export const getDays = (req, res) => {
    let {user_id} = req.params;
    connection.query(`select distinct day_id, (select min(day_id_amounts) from (select count(day_id) day_id_amounts from user_item where user_id='${user_id}' group by day_id) status_table) add_new_day_status, (select count(user_id) from user_item where time_id is null and user_id=${user_id}) day_amount from user_item where user_id='${user_id}' order by id asc`, function (error, results) {
        if (error) throw error;
        res.send(results);
    });
};

export const insertUserItem = (req, res) => {
    let data = req.body;
    const created = new Date().toISOString().slice(0,10);
    let query = `insert into user_item (user_id, day_id, time_id, food_id, portion_id, amount, nutrient_id, created) values (${data.user_id}, ${data.day_id}, ${data.time_id}, ${data.food_id}, ${data.portion_id}, ${data.amount}, ${data.nutrient_id}, '${created}')`;
    connection.query(query);
    res.send('success');

};

export const addDay = (req, res) => {
    let data = req.body;
    const created = new Date().toISOString().slice(0,10);
    connection.query(`insert into user_item (user_id, created) values ('${data.user_id}', '${created}')`, function (error, results) {
        if (error) throw error;
        let insertId_ = results['insertId'];
        connection.query(`update user_item set day_id=${insertId_} where id=${insertId_}`);
        res.send({day_id: insertId_});
    });
};

export const addTimeApi = (req, res) => {
    let data = req.body;
    connection.query(`insert into user_time (user_id, name, item_time) values ('${data.id}', '${data.item_name}', '${data.item_time}')`, function (error) {
        connection.query(`select id, TIME_FORMAT(item_time, '%h:%i %p') item_time, name from user_time where user_id='${data.id}' order by DATE_FORMAT(item_time, '%H:%i:%s')`, function (error, results) {
            if (error) throw error;
            res.send(results);
        });
    });
};

export const deleteTimeByUserIdTimeId = (req, res) => {
    let data = req.body;
    connection.query(`delete from user_time where id=${data.time_id} and user_id=${data.user_id}`, function (error) {
        connection.query(`delete from user_item where time_id=${data.time_id}`);
        connection.query(`select id, TIME_FORMAT(item_time, '%h:%i %p') item_time, name from user_time where user_id='${data.user_id}' order by DATE_FORMAT(item_time, '%H:%i:%s')`, function (error, results) {
            if (error) throw error;
            res.send(results);
        });
    });
};

export const getNutrientsInfoByUserIdDayId = (req, res) => {
    let {user_id, day_id} = req.body;
    let query;
    if(day_id === 'all') {
        query = `SELECT n.id, n.name, LOWER(n.unit_name) unit_name, n.dri_amount, ROUND(IFNULL(table2.real_amount, 0)/(SELECT COUNT(DISTINCT day_id) FROM user_item where user_id=${user_id}), 1) nutrient_sum, n.type FROM nutrient n LEFT JOIN (/*start 2*/SELECT fdc_id, nutrient_id, ROUND(SUM(real_amount), 2) real_amount FROM (/*start 1*/SELECT fn.fdc_id, fn.nutrient_id, fn.amount n_amount, ui.portion_id, IFNULL(fp.gram_weight, 100) portion_gram, ui.amount ui_amount, (IFNULL(fp.gram_weight, 100)*ui.amount) total_gram, (IFNULL(fp.gram_weight, 100)*ui.amount*fn.amount/100) real_amount FROM food_nutrient fn JOIN user_item ui ON fn.fdc_id=ui.food_id LEFT JOIN food_portion fp ON fp.id=ui.portion_id WHERE user_id=${user_id} /*end 1*/ ) table1 GROUP BY nutrient_id /*end 2*/) table2 ON n.id=table2.nutrient_id WHERE n.type IS NOT NULL ORDER BY n.name`;
    } else {
        query = `SELECT n.id, n.name, LOWER(n.unit_name) unit_name, n.dri_amount, ROUND(IFNULL(table2.real_amount, 0), 1) nutrient_sum, n.type FROM nutrient n LEFT JOIN (/*start 2*/SELECT fdc_id, nutrient_id, ROUND(SUM(real_amount), 2) real_amount FROM (/*start 1*/SELECT fn.fdc_id, fn.nutrient_id, fn.amount n_amount, ui.portion_id, IFNULL(fp.gram_weight, 100) portion_gram, ui.amount ui_amount, (IFNULL(fp.gram_weight, 100)*ui.amount) total_gram, (IFNULL(fp.gram_weight, 100)*ui.amount*fn.amount/100) real_amount FROM food_nutrient fn JOIN user_item ui ON fn.fdc_id=ui.food_id LEFT JOIN food_portion fp ON fp.id=ui.portion_id  WHERE user_id=${user_id} AND day_id=${day_id} /*end 1*/ ) table1 GROUP BY nutrient_id /*end 2*/) table2 ON n.id=table2.nutrient_id WHERE n.type IS NOT NULL ORDER BY n.name`;
    }
    connection.query(query, function (error, results) {
        if (error) throw error;
        let response = {general: [], carb: [], lipids: [], vitamins: [], minerals: [], proteins: [], mInfo: 0, vInfo: 0};
        let mc = 0, vc = 0;
        results.forEach(function (item) {
            if(item.dri_amount === null || item.dri_amount === 0) {
                item.dri_amount = 'No Target';
            } else if(item.nutrient_sum === 0) {
                item.dri_amount = 0;
            } else {
                item.dri_amount = item.nutrient_sum/item.dri_amount*100;
                item.dri_amount = item.dri_amount.toFixed(0);
            }
            if(item.type==='G') {
                response['general'].push(item);
            }

            if(item.type==='C') {
                response['carb'].push(item);
            }

            if(item.type==='L') {
                response['lipids'].push(item);
            }

            if(item.type==='V') {
                response['vitamins'].push(item);
                if(!isNaN(item.dri_amount) && item.dri_amount != 0) {
                    vc += 1;
                    response['vInfo'] += parseInt(item.dri_amount);
                }
            }

            if(item.type==='M') {
                response['minerals'].push(item);
                if(!isNaN(item.dri_amount) && item.dri_amount != 0) {
                    mc += 1;
                    response['mInfo'] += parseInt(item.dri_amount);
                }
            }

            if(item.type==='P') {
                response['proteins'].push(item);
            }
        });
        if(vc === 0) {vc = 1}
        if(mc === 0) {mc = 1}
        response['vInfo'] /= vc;
        response['mInfo'] /= mc;
        response['vInfo'] = response['vInfo'].toFixed(0);
        response['mInfo'] = response['mInfo'].toFixed(0);
        res.send(response);
    });
};

export const getNutrientsInfoByFoodId = (req, res) => {
    let {food_id, portion, amount} = req.body;
    // let query = `SELECT n.id, n.NAME name, n.unit_name, n.dri_amount, IFNULL(fn.amount, 0), n.type type FROM nutrient n  LEFT JOIN (SELECT nutrient_id, amount FROM food_nutrient WHERE fdc_id=168627) fn ON n.id=fn.nutrient_id WHERE n.TYPE IS NOT NULL`;
    connection.query(`select gram_weight from food_portion where id=${portion}`, function (error, results) {
        if(portion === 0) {
            portion = 100;
        } else {
            portion = results[0].gram_weight;
        }
        let query = `SELECT n.id, n.name, ROUND(IFNULL(fn.amount, 0), 1) nutrient_sum, LOWER(n.unit_name) unit_name, n.dri_amount, n.type, LOWER(n.dri_unit) dri_unit FROM food_nutrient fn JOIN nutrient n ON n.id=fn.nutrient_id WHERE fn.fdc_id=${food_id} ORDER BY n.name`;
        connection.query(query, function (error, results) {
            let food_amount = portion * amount;
            if (error) throw error;
            let response = {general: [], carb: [], lipids: [], vitamins: [], minerals: [], proteins: [], mInfo: 0, vInfo: 0};
            let mc = 0, vc = 0;
            results.forEach(function (item) {
                item.nutrient_sum = item.nutrient_sum * food_amount / 100;
                item.nutrient_sum = item.nutrient_sum.toFixed(1);
                if(item.dri_amount === null || item.dri_amount === 0 || isNaN(item.dri_amount)) {
                    item.dri_amount = 'No Target';
                } else if(item.nutrient_sum === 0) {
                    item.dri_amount = 0;
                } else {
                    item.dri_amount = item.nutrient_sum/item.dri_amount*100;
                    item.dri_amount = item.dri_amount.toFixed(0);
                }
                if (item.type === 'G') {
                    response['general'].push(item);
                }

                if (item.type === 'C') {
                    response['carb'].push(item);
                }

                if (item.type === 'L') {
                    response['lipids'].push(item);
                }

                if (item.type === 'V') {
                    response['vitamins'].push(item);
                    if(!isNaN(item.dri_amount) && item.dri_amount != 0) {
                        vc += 1;
                        response['vInfo'] += parseInt(item.dri_amount);
                    }
                }

                if (item.type === 'M') {
                    response['minerals'].push(item);
                    if(!isNaN(item.dri_amount) && item.dri_amount != 0) {
                        mc += 1;
                        response['mInfo'] += parseInt(item.dri_amount);
                    }
                }

                if (item.type === 'P') {
                    response['proteins'].push(item);
                }
            });
            if(vc === 0) {vc = 1}
            if(mc === 0) {mc = 1}
            response['vInfo'] /= vc;
            response['mInfo'] /= mc;
            response['vInfo'] = response['vInfo'].toFixed(0);
            response['mInfo'] = response['mInfo'].toFixed(0);
            res.send(response);
        });
    });
};

export const getNutrientDetailInfo = (req, res) => {
    let {user_id, day_id, nutrient_id} = req.body;
    let query = `select ui.id, ui.food_id, f.description, ROUND((IFNULL(fp.gram_weight, 100)/100*fn.amount*ui.amount), 1) real_amount, LOWER(n.unit_name) unit_name, ROUND((IFNULL(fp.gram_weight, 100)/100*fn.amount*ui.amount/(select dri_amount from nutrient where id=${nutrient_id})*100), 1) dri_amount from user_item ui join food_nutrient fn on ui.food_id=fn.fdc_id left join food_portion fp on ui.portion_id=fp.id JOIN food f ON ui.food_id=f.fdc_id left join nutrient n on n.id=${nutrient_id}  WHERE ui.user_id=${user_id} AND ui.day_id=${day_id} AND fn.nutrient_id=${nutrient_id} and fn.amount<>0`;
    connection.query(query, function (error, results) {
        if (error) throw error;
        res.send(results);
    });
};

export const copyCurrentDayToNewDay = (req, res) => {
    let {user_id, day_id} = req.body;
    connection.query(`insert into user_item (food_id) value (10)`, function (error, results) {
        if (error) throw error;
        const insertId = results['insertId'];
        connection.query(`delete from user_item where id=${insertId}`);
        const new_day_id = insertId + 1;
        connection.query(`insert into user_item (user_id, day_id, time_id, food_id, portion_id, amount, nutrient_id) select user_id, ${new_day_id} day_id, time_id, food_id, portion_id, amount, nutrient_id from user_item where user_id='${user_id}' and day_id='${day_id}'`, function (error, results) {
            if (error) throw error;
            res.send({day_id: new_day_id});
        });
    });
};

export const deleteCurrentDay = (req, res) => {
    let {user_id, day_id} = req.body;
    connection.query(`select count(user_id) count from user_item where time_id is null and user_id=${user_id}`, function (error, results) {
        let query;
        if(results[0].count === 1) {
            query = `delete from user_item where user_id='${user_id}' and day_id=${day_id} and time_id is not null`;
        } else {
            query = `delete from user_item where user_id='${user_id}' and day_id=${day_id}`;
        }
        connection.query(query, function (error, results) {
            if (error) throw error;
            connection.query(`SELECT day_id FROM user_item WHERE user_id=${user_id} ORDER BY id DESC LIMIT 1`, function (error, results) {
                let last_day_id = results[0].day_id;
                res.send({day_id: last_day_id});
            });
        });
    });
};

export const copyToDay = (req, res) => {
    let {user_id, day_id, to_day_id} = req.body;
    connection.query(`insert into user_item (user_id, day_id, time_id, food_id, portion_id, amount, nutrient_id) select user_id, ${to_day_id} day_id, time_id, food_id, portion_id, amount, nutrient_id from user_item where user_id='${user_id}' and day_id='${day_id}'`, function (error, results) {
        res.send('success');
    });
};

export const getMenuItemsByUserIdDayId = (req, res) => {
    let {user_id, day_id} = req.body;
    connection.query(`SELECT mvtable1.id, mvtable1.name, mvtable1.food_id, mvtable1.portion_id, IFNULL(fp.modifier, '') modifier, IFNULL(fp.gram_weight, 100)  portion_amount, mvtable1.amount, mvtable1.day_id, mvtable1.time_id, mvtable1.description,  mvtable1.unit_name, calories_table.calories, calories_table.food_id, mvtable1.nutrient_description_M, mvtable2.nutrient_description_V FROM (/*M, V table*/SELECT ui.id, ut.name, ut.item_time, ui.food_id, ui.portion_id, ui.amount, ui.day_id, ui.time_id, f.description, LOWER(n.unit_name) unit_name , GROUP_CONCAT(n.name, " ", ROUND(/*food_nutrient_amount*/fn.amount*IFNULL(fp.gram_weight, 100)*ui.amount/100/*food_nutrient_amount*//n.dri_amount*100, 0), "%") nutrient_description_M, (IFNULL(fp.gram_weight, 100)*ui.amount*fn.amount/100) real_amount, n.type FROM user_item ui JOIN user_time ut ON ui.time_id=ut.id JOIN food f ON ui.food_id=f.fdc_id JOIN food_nutrient fn ON ui.food_id=fn.fdc_id LEFT JOIN food_portion fp ON ui.portion_id=fp.id JOIN nutrient n ON fn.nutrient_id=n.id WHERE ui.user_id=${user_id} AND ui.day_id=${day_id} AND n.type="M" GROUP BY ui.id ORDER BY ut.item_time, f.description, fn.nutrient_id/*M, V table end*/) mvtable1 LEFT JOIN (/*M, V table*/SELECT ui.id, ui.food_id, GROUP_CONCAT(n.name, " ", ROUND(/*food_nutrient_amount*/fn.amount*IFNULL(fp.gram_weight, 100)*ui.amount/100/*food_nutrient_amount*//n.dri_amount*100, 2), "%") nutrient_description_V FROM user_item ui JOIN user_time ut ON ui.time_id=ut.id JOIN food f ON ui.food_id=f.fdc_id JOIN food_nutrient fn ON ui.food_id=fn.fdc_id LEFT JOIN food_portion fp ON ui.portion_id=fp.id JOIN nutrient n ON fn.nutrient_id=n.id WHERE ui.user_id='${user_id}' AND ui.day_id='${day_id}' AND n.type="V" GROUP BY ui.id ORDER BY ut.item_time, f.description, fn.nutrient_id/*M, V table end*/) mvtable2 ON mvtable1.id=mvtable2.id LEFT JOIN (SELECT ui.id, ui.food_id, fn.amount, ROUND(fn.amount*IFNULL(fp.gram_weight, 100)*ui.amount/100, 0) calories FROM user_item ui JOIN food_nutrient fn ON ui.food_id=fn.fdc_id LEFT JOIN food_portion fp ON ui.portion_id=fp.id WHERE fn.nutrient_id=1008 and ui.user_id=${user_id} and ui.day_id=${day_id}) calories_table ON mvtable1.id=calories_table.id left join food_portion fp on mvtable1.portion_id=fp.id`, function (error, menu_items) {
        connection.query(`SELECT id, TIME_FORMAT(item_time, '%h:%i %p') item_time, name FROM user_time WHERE user_id='${user_id}' ORDER BY DATE_FORMAT(item_time, '%H:%i:%s')`, function (error, user_times) {
            res.send({menu_items, user_times});
        });
    });
};

export const setPasteApi = (req, res) => {
    let {type, from_day_id, to_day_id, from_time_id, to_time_id, user_id, user_item_id} = req.body;
    let query = '';
    if(type === 'group') {
        query = `insert into user_item (user_id, day_id, time_id, food_id, portion_id, amount) select user_id, ${to_day_id} day_id, ${to_time_id} time_id, food_id, portion_id, amount from user_item where user_id='${user_id}' and day_id='${from_day_id}' and time_id='${from_time_id}'`;
    } else {
        query = `insert into user_item (user_id, day_id, time_id, food_id, portion_id, amount) select user_id, ${to_day_id} day_id, ${to_time_id} time_id, food_id, portion_id, amount from user_item where id=${user_item_id} and food_id is not null`;
    }
    connection.query(query, function (error, results) {
        res.send('success');
    });
};

export const deleteItemByUserItemId = (req, res) => {
    let {user_item_id} = req.body;
    connection.query(`delete from user_item where id=${user_item_id}`, function (error, results) {
        res.send('success');
    });
};

export const editItemByUserItemId = (req, res) => {
    let {user_item_id, amount, portion_id} = req.body;
    connection.query(`update user_item set amount='${amount}', portion_id='${portion_id}' where id=${user_item_id}`, function (error, results) {
        res.send('success');
    });
};

export const dragApi = (req, res) => {
    let {from_id, to_time_id} = req.body;
    connection.query(`insert into user_item (user_id, day_id, time_id, food_id, portion_id, amount, nutrient_id) select user_id, day_id, ${to_time_id}, food_id, portion_id, amount, nutrient_id from user_item where id='${from_id}'`, function (error, results) {
        connection.query(`delete from user_item where id=${from_id}`, function (error, results) {
            res.send('success');
        });
    });
};
//
