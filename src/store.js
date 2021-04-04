import Vue from 'vue'
import Vuex from 'vuex'
import PouchDB from 'pouchdb-browser'
import { v4 as uuidv4 } from 'uuid'

Vue.use(Vuex)

let board = new PouchDB('board')
var remoteCouch = process.env.VUE_APP_COUCHDB_URL

const setNewPosition = (toList, toIndex, fromIndex) => {
  let newPosition

  const listLength = toList.length
  const isColumnEmpty = listLength === 0

  let toItem
  isColumnEmpty ? toItem = [] : toItem = toList[toIndex]

  const toPosition = toItem.position

  const isIndexFirst = toIndex === 0
  const isIndexLast = toIndex === listLength - 1

  if (isColumnEmpty) {
    // Scenario 1: When a task is moved to an empty column
    newPosition = 0.1
  } else if (isIndexFirst) {
    // Scenario 1: When a column is moved to the first position
    newPosition = toPosition / 2
  } else if (isIndexLast) {
    // Scenario 2: When a column is moved to the last position
    const nextToLastPosition = (listLength + 1) / 10
    newPosition = (toPosition + nextToLastPosition) / 2
  } else if (fromIndex < toIndex) {
    // Scenario 3: When a column is moved from left to right
    const nextItem = toList[toIndex + 1]
    const nextItemPosition = nextItem.position
    newPosition = (nextItemPosition + toPosition) / 2
  } else if (fromIndex > toIndex) {
    // Scenario 4: When a column is moved from right to left
    const previousItem = toList[toIndex - 1]
    const previousItemPosition = previousItem.position
    newPosition = (previousItemPosition + toPosition) / 2
  } else if (fromIndex === toIndex) {
    // Scenario 5: When a column is moved and returned to same place
    newPosition = toPosition
  }
  return newPosition
}

export default new Vuex.Store({
  state: {
    columns: [],
    tasks: [],
    taskHasConflict: false
  },
  actions: {
    async fetchAllData ({ commit }) {
      try {
        const doc = await board.allDocs({ include_docs: true })
        commit('SET_BOARD', doc.rows)
      } catch (error) {
        console.log(error)
      }
    },
    dbSync ({ dispatch }) {
      const opts = { live: true }
      board
        .sync(remoteCouch, opts)
        .on('change', () => {
          dispatch('fetchAllData')
        })
        .on('error', error => console.log(error))
    },

    async addColumn ({ state, commit }, name) {
      try {
        /* COLUMN POSITION A position attribute is added for each new column
        created. Each position is given a float number instead of an integer.
        This allows for ordering of the list without having to update the
        positions of the adjoining items. The float number for the position is
        calculated by incrementing the column array length by one and dividing
        by 10 yielding a series of float position like 0.1, 0.2, 0.3 etc.
        Reference: http://guide.couchdb.org/draft/recipes.html#ordering */

        const newPosition = (state.columns.length + 1) / 10
        const newColumn = {
          _id: uuidv4(),
          name,
          type: 'column',
          position: newPosition
        }
        const result = await board.put(newColumn)
        commit('CREATE_COLUMN', { result, name, newPosition })
      } catch (error) {
        console.log(error)
      }
    },
    async addTask ({ commit }, { name, columnId, filteredTasks }) {
      try {
        /* TASK POSITION The task position is calculated in the exact same way
        as the column position as explained in the `addColumn` action above. For
        tasks instead of taking the entire tasks array length, the length of the
        tasks filtered by the selected column is taken. This allows for the task
        to be sorted per column. */

        const newPosition = (filteredTasks.length + 1) / 10
        const newTask = {
          _id: uuidv4(),
          name,
          type: 'task',
          columnId,
          description: '',
          position: newPosition
        }
        const result = await board.put(newTask)
        commit('CREATE_TASK', { result, name, columnId, newPosition })
      } catch (error) {
        console.log(error)
      }
    },
    async editTask ({ state, commit }, { taskId, key, value }) {
      // TODO: need to revisit to ensure simultaneous editing is addressed (need to make use of 'rev'/ or use full task object)
      try {
        const doc = await board.get(taskId)
        const editedTask = state.tasks.filter(task => task._id === taskId)
        const isTaskRevSame = editedTask[0]._rev === doc._rev

        if (isTaskRevSame) {
          doc[key] = value
          await board.put(doc)
          commit('UPDATE_TASK', { taskId, key, value })
        } else {
          commit('ALERT_TASK_CONFLICT')
        }
      } catch (error) {
        console.log(error)
      }
    },

    async changeColumnPosition (
      { state, commit, dispatch },
      { columnId, fromColumnIndex, toColumnIndex }
    ) {
      try {
        /* NEW POSITION The new position of the column that is moved, is the
        median of the position of the two surrounding columns. */
        /* setNewPosition is an implicit dependency on the changing the position
        in the database. this causes a implicit side effect. having the
        setNewPosition as a function shows the dependency clearly. */
        // TODO: remove the state assignment from the setNewPosition. the state for position is unnecessary
        const newPosition = setNewPosition(state.columns, toColumnIndex, fromColumnIndex)
        const doc = await board.get(columnId)
        doc.position = newPosition
        await board.put(doc)
        commit('MOVE_COLUMN', {
          fromColumnIndex,
          newPosition
        })
      } catch (error) {
        console.log(error)
      }
    },
    async changeTaskPosition (
      { state, commit, dispatch },
      { fromTaskIndex, toTaskIndex, fromTaskId, toTaskColumnId }
    ) {
      try {
        const toTasksList = state.tasks.filter(
          task => toTaskColumnId === task.columnId
        )

        /* NEW POSITION The new position of the task that is moved, is the
        median of the position of the two surrounding tasks. */
        const newPosition = setNewPosition(state, toTasksList, toTaskIndex, fromTaskIndex)

        const doc = await board.get(fromTaskId)
        doc.columnId = toTaskColumnId
        doc.position = newPosition
        await board.put(doc)
        commit('MOVE_TASK', {
          toTaskColumnId,
          fromTaskId,
          newPosition
        })
      } catch (error) {
        console.log(error)
      }
    }
  },
  mutations: {
    SET_BOARD (state, data) {
      // TODO: Refactor to make code simpler to use explicit if-else
      const setData = (docType, item, state) => {
        // TODO: make the itemstate a const and convert to separate function
        //  Get the column or task list from state
        const getItemState = (docType) => {
          if (docType === 'column') {
            return state.columns
          } else {
            return state.tasks
          }
        }
        const itemState = getItemState(docType)

        //  Find column or task index
        // TODO: do similar refactor as the sort byPosition
        const matchItemId = (value) => value._id === item.doc._id
        const index = itemState.findIndex(matchItemId)
        // const findItemIndex = (items) => {
        //   return items.findIndex(data => data._id === item.doc._id)
        // }
        // const index = findItemIndex(itemState)

        // TODO: better to make it if-else for clarity
        const itemExists = index !== -1 // TODO: maybe overkill to create a new variable
        if (itemExists) {
          // Replace existing column or task if item exits
          itemState[index] = item.doc
        } else {
          // Add new column or task if it doesn't exist
          itemState.push(item.doc)
        }
        //  Sort column or task
        // TODO: add a function eg. byPosition to separate
        // TODO: the byPosition just does the position sort and be a utility function used across the app
        const sortByPosition = (a, b) => a.position - b.position
        itemState.sort(sortByPosition)
        // const sortByPosition = (items) => {
        //   items.sort((a, b) => a.position - b.position)
        // }
        // sortByPosition(itemState)
      }

      data.map(item => {
        setData(item.doc.type, item, state)
      })
    },
    CREATE_COLUMN (state, { result, name, newPosition }) {
      state.columns.push({
        name,
        type: 'column',
        position: newPosition,
        _id: result.id,
        _rev: result.rev
      })
    },
    CREATE_TASK (state, { result, name, columnId, newPosition }) {
      state.tasks.push({
        name,
        type: 'task',
        columnId,
        description: '',
        position: newPosition,
        _id: result.id,
        _rev: result.rev
      })
    },
    UPDATE_TASK (state, { taskId, key, value }) {
      const taskIndex = state.tasks.findIndex(task => {
        return task._id === taskId
      })
      state.tasks[taskIndex][key] = value
    },
    ALERT_TASK_CONFLICT (state) {
      state.taskHasConflict = true
    },
    MOVE_TASK (state, { toTaskColumnId, fromTaskId, newPosition }) {
      state.tasks.map(task => {
        if (task._id === fromTaskId) {
          task.columnId = toTaskColumnId
          task.position = newPosition
        }
      })
    },
    MOVE_COLUMN (state, { fromColumnIndex, newPosition }) {
      state.columns[fromColumnIndex].position = newPosition
    }
  }
})
