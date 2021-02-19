// import { uuid } from './utils'
import { v4 as uuidv4 } from 'uuid'

export default {
  name: 'workshop',
  columns: [
    {
      name: 'Todo',
      tasks: [
        {
          description: '',
          name: 'First task',
          id: uuidv4(),
          userAssigned: null
        },
        {
          description: '',
          name: 'Second task',
          id: uuidv4(),
          userAssigned: null
        },
        {
          description: '',
          name: 'Third task',
          id: uuidv4(),
          userAssigned: null
        }
      ]
    },
    {
      name: 'In-progress',
      tasks: [
        {
          description: '',
          name: 'First task',
          id: uuidv4(),
          userAssigned: null
        }
      ]
    },
    {
      name: 'Done',
      tasks: [
        {
          description: '',
          name: 'First task',
          id: uuidv4(),
          userAssigned: null
        }
      ]
    }
  ]
}
