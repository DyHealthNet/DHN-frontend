<template>
<!-- Dropdown List -->
  <div>
    <v-row v-if="limitedDropdownNodes.length && !isReadOnly">
      <v-col cols="12">
        <v-card class="dropdown"
                v-if="showDropdown"
                ref="dropdownMenu"
                tabindex="0">
          <v-list>
            <v-list-item
                v-for="(item, index) in limitedDropdownNodes"
                :key="item.id"
                @click="$emit('add-per-drop-down', item)"
                @mouseover="hoverNode(item)"
                @mouseleave="hoverNodeLeave"
                :class="{ 'text-primary': index === activeIndex }"
                :color="index === activeIndex ? 'primary' : ''"
                class="d-flex align-center text-truncate"
            >
              <!-- Icon Section -->
              <v-icon
                  class="me-3"
                  size="32"
                  color="transparent"
              >
                <v-img
                    :src="getIcon(getPrettyType(item.source_table))"
                    alt="icon"
                    max-width="32"
                    max-height="32"
                    class="me-0 rounded-circle"
                ></v-img>
              </v-icon>
              <!-- Text Section -->
              <span class="text-subtitle-1">
                {{ `${item.display_name} (${item.id})` }}
                </span>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>

    <!-- Tooltip for Hovered Item (outside dropdown) -->
    <teleport to="body">
      <div v-if="hoveredItem" class="tooltip" :style="tooltipStyle">
        <strong>ID:</strong> {{ hoveredItem.id }}<br/>
        <strong>Display Name:</strong> {{ hoveredItem.display_name }}<br/>
        <strong>Node Type:</strong> {{ hoveredItem.source_table }}<br/>
        <strong>Description:</strong> {{ hoveredItem.description }}
      </div>
    </teleport>
  </div>
</template>
<script >
import {getIcon, getPrettyType} from "@/components/generalFunctions.js";

export default {
  name: "DropdownHover",
  props: {
    isReadOnly: {
      type: Boolean,
      default: false,
    },
    textFieldRef: {
      type: Object,
      default: () => ({ value: null })
    },
    showDropdown: {
      type: Boolean,
      required: true,
    },
    dropdownNodes: {
      type: Array,
      required: true,
    },
  },
  emits: ['add-per-drop-down', 'update:showDropdown'],
  data() {
    return {
      activeIndex : -1,
      tooltipStyle: {},
      hoveredItem: null,
    };
  },
  computed: {
    store() {
      return hoverDropdownStore(); // this makes this.store available
    },
    limitedDropdownNodes() {
      return this.dropdownNodes.slice(0, 5);
    },
  },
  methods: {
    getIcon,
    getPrettyType,

    hoverNode(item) {
      if (this.hoveredItem?.id === item.id) return;
      this.hoveredItem = item;

      if (item) {
        const dropdown = this.$refs.dropdownMenu?.$el; // Accessing the actual DOM element
        const dropdownRect = dropdown.getBoundingClientRect();
        const centerX = (window.innerWidth) / 2; // Center of the page

        // Calculate fixed position: right-center of the dropdown
        this.tooltipStyle = {
          backgroundColor: `rgb(var(--v-theme-primary-darken-1))`,
          color: `rgb(var(--v-theme-surface))`,
          borderRadius: '5px',
          padding: '10px',
          position: 'absolute',
          top: `${dropdownRect.top + dropdownRect.height / 2 + window.scrollY - 80}px`, // Vertically centered
          left: `${centerX}px`,  // Right of the dropdown
          zIndex: 1000,
        };
      }
    },
    hoverNodeLeave() {
      // Hide the tooltip when the item is no longer hovered
      this.hoveredItem = null;
      this.activeIndex = -1;
    },
    handleClickOutside(event) {
      // handle clicks outside the dropdown only if dropdown currently shown
      if (this.showDropdown){
        //TODO delete? why is these here? dropdown should be closed in nodeInput when readonly gets applied
        if (this.isReadOnly) {
          this.closeDropdown()
          return;
        }
        const dropdown = this.$refs.dropdownMenu?.$el || this.$refs.dropdownMenu; // Accessing the dropdown Hover DOM element
        const textField = this.textFieldRef.$el || this.textFieldRef // Accessing the Text or whatnot field DOM element

        // Check if dropdown and textField are not undefined and if the clicked element is inside either - if not close
        // dropdown
        if (
            dropdown && !dropdown.contains(event.target) &&
            textField && !textField.contains(event.target)
        ) {
          this.closeDropdown()
        }
      }
    },
    moveFocus(direction) {
      console.log("this.showDropdown", this.showDropdown)
      console.log("this.dropdownNodes", this.dropdownNodes)
      if (this.isReadOnly) return;
      const length = this.limitedDropdownNodes.length;
      if (direction === "down") {
        this.activeIndex = (this.activeIndex + 1) % length;
      } else if (direction === "up") {
        if (this.activeIndex === -1) {
          this.activeIndex = length - 1;  // Start from the last item if moving up from -1
        } else {
          this.activeIndex = (this.activeIndex - 1 + length) % length;
        }
      }
      if (this.activeIndex === -1) {
        return;
      }
      this.hoverNode(this.limitedDropdownNodes[this.activeIndex]);
    },
    selectFocusedItem() {
      if (this.activeIndex === -1) {
        return;
      }
      const selectedItem = this.limitedDropdownNodes[this.activeIndex];
      if (selectedItem) {
        console.log("addPerDropDown selectedItem", selectedItem)
        this.$emit('add-per-drop-down', selectedItem);
      }
    },
    closeDropdown() {
      this.$emit('update:showDropdown', false);
      this.hoveredItem = null;
      this.activeIndex = -1;
    },
  },
  watch: {
    // Watch the store property explicitly
    'showDropdown'(newVal) {
      if (newVal) {
        document.addEventListener('click', this.handleClickOutside)
        this.activeIndex = -1
      } else {
        document.removeEventListener('click', this.handleClickOutside)
      }
    },
  },
  unmounted() {
    document.removeEventListener('click', this.handleClickOutside);
  },
};

</script>