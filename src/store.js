import Vue from 'vue'
import Vuex from 'vuex'
import PouchDB from 'pouchdb-browser'
// import defaultBoard from './default-board'
import { saveStatePlugin } from './utils'

Vue.use(Vuex)

// const board = JSON.parse(localStorage.getItem('board')) || defaultBoard

let board = new PouchDB('board')

export default new Vuex.Store({
  plugins: [saveStatePlugin],
  state: {
    columns: [],
    tasks: []
  },
  getters: {
    getTask (state) {
      return (id) => {
        for (const column of state.columns) {
          for (const task of column.tasks) {
            if (task.id === id) {
              return task
            }
          }
        }
      }
    }
  },
  actions: {
    fetchAllData ({ commit }) {
      board.allDocs({ include_docs: true }).then(doc => {
        console.log('**fetch data doc.row', doc.rows)
        commit('SET_BOARD', doc.rows)
      }).catch(error => {
        console.log(error)
      })
    },
    addColumn ({ commit }, name) {
      const newColumn = {
        _id: new Date().toISOString(),
        name,
        type: 'column'
      }
      board.put(newColumn).then(result => {
        commit('CREATE_COLUMN', { result, name })
      }).catch(error => {
        console.log(error)
      })
    },
    addTask ({ commit }, { name, columnId }) {
      const newTask = {
        _id: new Date().toISOString(),
        name,
        type: 'task',
        columnId,
        description: ''
      }
      board.put(newTask).then(result => {
        commit('CREATE_TASK', { result, name, columnId })
        console.log('success task added to pouch')
      }).catch(error => {
        console.log(error)
      })
    }
  },
  mutations: {
    CREATE_TASK (state, { result, name, columnId }) {
      state.tasks.push({
        doc: {
          _id: result.id,
          name,
          type: 'task',
          columnId,
          description: ''
        }
      })
    },
    UPDATE_TASK (state, { task, key, value }) {
      Vue.set(task, key, value)
    },
    MOVE_TASK (state, { fromTasks, toTasks, fromTaskIndex, toTaskIndex }) {
      const taskToMove = fromTasks.splice(fromTaskIndex, 1)[0]
      toTasks.splice(toTaskIndex, 0, taskToMove)
    },
    MOVE_COLUMN (state, { fromColumnIndex, toColumnIndex }) {
      const columnList = state.board.columns
      const columnToMove = columnList.splice(fromColumnIndex, 1)[0]
      columnList.splice(toColumnIndex, 0, columnToMove)
    },
    CREATE_COLUMN (state, { result, name }) {
      state.columns.push({
        doc: {
          _id: result.id,
          name,
          type: 'column'
        }
      })
    },
    SET_BOARD (state, data) {
      data.map(item => {
        item.doc.type === 'column' ? state.columns.push(item) : state.tasks.push(item)
      })
    }
  }
})
