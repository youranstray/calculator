(function () {
    let app6 = new Vue({
        el: '#statistics-app',
        data: {
            tabel: [],
            students: [],
            gradeInfo: {
                curYear: '',
                curSemester: '',
                curGrade: '',
                curClass: '',
                curCourse: '',
                curTerm: ''
            },
            rates: null,
            results: {
                totals: null, // 总人数
                totalsOfPassed: null, // 合格人数
                totalsOfOustandings: null, // 优秀人数

                totalScore: null, // 总分
                totalScoreAfter30: null, // 后30%的总分
                totalScoreOf4Rate: null, // 四率总分

                averageScore: null, // 人平分
                averageScoreAfter30: null, // 后30%的人平分

                passedRate: null, // 合格率
                oustandingRate: null, // 优秀率
            },
            isReviewing: false,
            isPrinting: false,
            historyList: []
        },
        mounted: function() {
            this.init()
        },
        methods: {
            init: function() {
                this.initRates()
                this.initGradeInfo()
                this.initTabel()
                this.historyList = localStorage.getItem('historyList') ? JSON.parse(localStorage.getItem('historyList')) : []
            },
            initGradeInfo: function() {
                this.gradeInfo = {
                    curYear: '',
                    curSemester: '',
                    curGrade: '',
                    curClass: '',
                    curCourse: '',
                    curTerm: ''
                }
                let dt = new Date()
                let mm = dt.getMonth() + 1 
                this.gradeInfo.curYear = dt.getFullYear()
                if (mm < 2 || mm > 8) {
                    this.gradeInfo.curSemester = '上'
                } else if ( 2 < mm < 8) {
                    this.gradeInfo.curSemester = '下'
                }
                if ('上' == this.gradeInfo.curSemester) {
                    this.gradeInfo.curTerm = mm < 12 && 9 < mm ? '中' : '末'
                } else {
                    this.gradeInfo.curTerm = mm < 6 && 3 < mm ? '中' : '末'
                }
            },
            initRates: function() {
                this.rates = new Array(
                    {id: 'rts_0', name: '及格率', value: 0.4}, 
                    {id: 'rts_1', name: '优秀率', value: 0.2}, 
                    {id: 'rts_2', name: '人平分', value: 0.3}, 
                    {id: 'rts_3', name: '后30%人平分', value: 0.1}
                )
            },
            initTabel: function() {
                this.tabel = new Array(80)
                for (let i = 0; i < 80; i++) {
                    this.tabel[i] = {
                        id: 'std_' + i,
                        name: null,
                        grade: null
                    }
                }
            },
            onItemChanged: function(key, item) {
                if (!item || !item.id || !key) return

                let index = this.findIndex(this.students, function(itm, idx) {
                    return itm.hasOwnProperty('id') && item.id == itm.id // get the index of the insert item of the students
                })
                if ((index > -1 && this.isDiff(item, this.students[index], key)) || -1 == index) {
                    if (index > -1) {
                        this.students[index][key] = item[key] // update value of the key
                    } else {
                        this.students.push(item) // copy value from the key of the item
                        index = this.students.length - 1 // and get new insert index
                    }

                    !this.students[index].name && !this.students[index].grade ? this.students.splice(index, 1) : null
                }
                return
            },
            gradeCalculate: function() {
                if (!this.students || 0 == this.students.length) return;

                this.isReviewing = true
                let totals = 0, // 总人数
                    totalsOfPassed = 0, // 合格人数
                    totalsOfOustandings = 0, // 优秀人数
                    totalScore = 0, // 总分
                    totalScoreAfter30 = 0, // 后30%的总分
                    totalScoreOf4Rate = 0, // 四率总分
                    averageScore = 0, // 人平分
                    averageScoreAfter30 = 0, // 后30%的人平分
                    passedRate = 0, // 合格率
                    oustandingRate = 0; // 优秀率

                this.students = this.students.sort(this.gradeCompare)
                totals = this.students.length
                for (let i = 0; i < this.students.length; i ++) {
                    // totals ++;
                    this.students[i].grade > 59 ? totalsOfPassed ++ : null;
                    this.students[i].grade > 79 ? totalsOfOustandings ++ : null;
                    totalScore += Number(this.students[i].grade);
                    totals - i <= this.getRound(totals * 0.3, 0) ? totalScoreAfter30 += Number(this.students[i].grade) : null;
                }
                passedRate = this.getRound(totalsOfPassed / totals, 4)
                oustandingRate = this.getRound(totalsOfOustandings / totals, 4)
                averageScore = this.getRound(totalScore / totals)
                averageScoreAfter30 = this.getRound(totalScoreAfter30 / this.getRound(totals * 0.3, 0))

                // 假设xx年xx班总共30个人（及格率90%和优秀率85%，人平分88，后30%后人平分80)。则四率总分=90*40% + 88*30% + 80*10% + 85*20%=87.4
                totalScoreOf4Rate = this.getRound((passedRate * 100) * this.rates[0].value + (oustandingRate * 100) * this.rates[1].value + averageScore * this.rates[2].value + averageScoreAfter30 * this.rates[3].value)

                this.results = {
                    totals: totals, // 总人数
                    totalsOfPassed: totalsOfPassed, // 合格人数
                    totalsOfOustandings: totalsOfOustandings, // 优秀人数
                    totalScore: totalScore, // 总分
                    totalScoreAfter30: totalScoreAfter30, // 后30%的总分
                    totalScoreOf4Rate: totalScoreOf4Rate, // 四率总分
                    averageScore: averageScore, // 人平分
                    averageScoreAfter30: averageScoreAfter30, // 后30%的人平分
                    passedRate: (passedRate * 100) + '%', // 合格率
                    oustandingRate: (oustandingRate * 100) + '%', // 优秀率
                }
            },
            print: function() {
                this.setStorage()
                this.isPrinting = true
                setTimeout(function() {
                    window.print()
                    setTimeout(function() {
                        window.location.reload()
                    }, 1000)
                }, 300)
            },
            setStorage: function() {
                let curRecord = {
                    timestamp: (new Date()).getFullYear() + '/' + ((new Date()).getMonth() + 1) + '/' + (new Date()).getDay() + ' ' + (new Date()).getHours() + ':' + (new Date()).getMinutes() + ':' + (new Date()).getSeconds(),
                    name: this.gradeInfo.curYear + '年 ' + this.gradeInfo.curSemester + '学期 ' + this.gradeInfo.curGrade + '年级 ' + this.gradeInfo.curClass + '班级 ' + this.gradeInfo.curCourse + '科 期' + this.gradeInfo.curTerm + '成绩表',
                    tabel: this.tabel,
                    students: this.students,
                    rates: this.rates,
                    gradeInfo: this.gradeInfo,
                    // results: this.results
                }
                let historyList = localStorage.getItem('historyList') ? JSON.parse(localStorage.getItem('historyList')) : []
                historyList.push(curRecord)
                localStorage.setItem('historyList', JSON.stringify(historyList))
            },
            importRecord: function(record, index) {
                this.tabel = record.tabel
                this.students = record.students
                this.rates = record.rates
                this.gradeInfo = record.gradeInfo
            },
            removeRecord: function(record, index) {
                this.historyList.splice(index, 1);
                localStorage.setItem('historyList', JSON.stringify(this.historyList))
            },
            gradeCompare: function(itm1, itm2) {
                let g1 = itm1.grade, g2 = itm2.grade;
                return g2 - g1
            },
            getRound: function(num, len) {
                num = num || 0
                len = (len || 0 == len) ? len : 2
                return Math.round(num * Math.pow(10, len)) / Math.pow(10, len)
            },
            isDiff: function(cur, pre, key) {
                return (cur[key] || pre[key]) && (pre[key] != cur[key])
            },
            findIndex: function(arr, callback) {
                let index = -1
                if (arr && arr.length > 0) {
                    for (let i = 0; i < arr.length; i ++) {
                        if (callback(arr[i], i)) {
                            index = i
                            break;
                        }
                    }
                }
                return index
            }
        }
    })
})()